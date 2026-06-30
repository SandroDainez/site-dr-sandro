import type OpenAI from "openai";
import { MEDICAL_ASSISTANT_SYSTEM_PROMPT } from "./system-prompt";
import { searchInternalLibrary, libraryIsConfident, unirHits, type LibraryHit } from "./search-library";
import { searchPubMed, type PubmedHit } from "./search-pubmed";
import { stripFabricatedPmids, garantirDisclaimer } from "./guardrails";

export type Fonte = { titulo: string; url: string | null; tipo: string; pmid?: string };
export type AssistResult = {
  resposta: string;
  fontes: Fonte[];
  usouPubmed: boolean;
  semFonte: boolean;
};

type SupabaseLike = { rpc: (fn: string, args: Record<string, unknown>) => any };

export const RECUSA_FORA_ESCOPO =
  "Sou um assistente especializado em Anestesiologia, Medicina Intensiva e Medicina de Emergência. Posso ajudar com dúvidas clínicas, farmacologia, ventilação, protocolos e o conteúdo da plataforma — mas não respondo assuntos fora da área médica.";

// Filtro de escopo (STEP 0): classificador barato que barra pergunta não-médica
// ANTES de gastar RAG/PubMed/gpt-4o. Saudações e perguntas sobre o próprio
// assistente contam como dentro do escopo. Falha → libera (fail-open: não bloqueia
// usuário legítimo por erro de API; o system prompt ainda reforça o escopo).
async function dentroDoEscopo(openai: OpenAI, pergunta: string): Promise<boolean> {
  try {
    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 3,
      messages: [{
        role: "user",
        content: `Você filtra um assistente médico (anestesiologia, terapia intensiva, emergência, clínica, farmacologia, ensino médico). A mensagem abaixo está DENTRO desse escopo? Saudações ("oi", "obrigado") e perguntas sobre o próprio assistente contam como SIM. Assuntos não-médicos (política, notícias, entretenimento, esportes, programação, finanças, receitas, etc.) são NÃO. Responda APENAS "SIM" ou "NAO".\n\nMensagem: "${pergunta}"`,
      }],
    });
    const v = (r.choices[0].message.content ?? "").trim().toUpperCase();
    return !v.startsWith("NAO") && !v.startsWith("NÃO");
  } catch {
    return true;
  }
}

// PLANEJAMENTO DE BUSCA (decomposição): para cobrir TODA a literatura de forma
// organizada, o sistema quebra a pergunta nas suas FACETAS clínicas (diagnóstico,
// conduta, doses, classes de fármacos, contraindicações, complicações, monitorização)
// e gera uma consulta de busca para cada. Cada consulta varre a biblioteca inteira;
// depois unimos tudo. Assim uma resposta de "sepse" recupera antibiótico + volume +
// vasopressor + lactato + foco, não só o trecho mais óbvio. Fail-safe → [pergunta].
async function planejarBusca(openai: OpenAI, pergunta: string): Promise<string[]> {
  try {
    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [{
        role: "user",
        content: `Você planeja a RECUPERAÇÃO de um assistente médico que precisa responder de forma COMPLETA com base em livros. Para a pergunta abaixo, gere de 3 a 6 CONSULTAS DE BUSCA curtas e específicas que, JUNTAS, cubram todas as facetas necessárias (ex.: diagnóstico/critérios, conduta/passos, doses e fármacos, contraindicações/cautelas, complicações, monitorização). Cada consulta com sinônimos e termos em inglês quando útil. Se a pergunta for simples e pontual, 1-2 consultas bastam. Responda APENAS JSON: {"consultas": ["...", "..."]}.\n\nPergunta: ${pergunta}`,
      }],
    });
    const parsed = JSON.parse(r.choices[0].message.content ?? "{}");
    const consultas: string[] = Array.isArray(parsed.consultas) ? parsed.consultas.filter((q: any) => typeof q === "string" && q.trim()).slice(0, 6) : [];
    // sempre inclui a pergunta original como uma das consultas
    return [pergunta, ...consultas.filter((q) => q.toLowerCase() !== pergunta.toLowerCase())];
  } catch {
    return [pergunta];
  }
}

function pubmedLabel(p: PubmedHit): string {
  const partes = [p.autores, p.titulo + ".", [p.journal, p.ano].filter(Boolean).join(". ")].filter(Boolean);
  return partes.join(" ");
}

// Monta o CONTEXTO numerado [1], [2]... (interno primeiro, depois PubMed).
function buildContext(lib: LibraryHit[], pubmed: PubmedHit[]): string {
  const linhas: string[] = [];
  let n = 0;
  for (const t of lib) {
    n++;
    linhas.push(`[${n}] BIBLIOTECA INTERNA — ${t.fonte_tipo}${t.fonte_titulo ? ` · ${t.fonte_titulo}` : ""}\n${t.conteudo}`);
  }
  for (const p of pubmed) {
    n++;
    linhas.push(`[${n}] PUBMED — ${pubmedLabel(p)} | PMID: ${p.pmid}\n${p.resumo || "(sem abstract disponível)"}`);
  }
  return linhas.join("\n\n");
}

// Pipeline: biblioteca interna → (se insuficiente) PubMed → LLM → guardrails → fontes.
export async function handleMedicalQuery(
  supabase: SupabaseLike,
  openai: OpenAI,
  pergunta: string,
): Promise<AssistResult> {
  // STEP 0 — filtro de escopo: barra assunto fora da medicina antes de gastar RAG/PubMed/LLM
  if (!(await dentroDoEscopo(openai, pergunta))) {
    return { resposta: RECUSA_FORA_ESCOPO, fontes: [], usouPubmed: false, semFonte: true };
  }

  // STEP 1 — biblioteca interna com BUSCA POR DECOMPOSIÇÃO: cada faceta da pergunta vira
  // uma consulta que varre toda a biblioteca; unimos tudo p/ cobertura completa e organizada.
  let lib: LibraryHit[] = [];
  try {
    const consultas = await planejarBusca(openai, pergunta);
    const grupos = await Promise.all(
      consultas.map((q) => searchInternalLibrary(supabase, q, 8).catch(() => [] as LibraryHit[])),
    );
    lib = unirHits(grupos, 20);
  } catch { lib = []; }

  // STEP 2 — PubMed só se a biblioteca não for suficiente
  let pubmed: PubmedHit[] = [];
  if (!libraryIsConfident(lib)) {
    pubmed = await searchPubMed(openai, pergunta).catch(() => []);
  }

  const semFonte = lib.length === 0 && pubmed.length === 0;
  const contexto = buildContext(lib, pubmed);

  // STEP 3 — LLM com system prompt + contexto recuperado
  const userContent = semFonte
    ? `CONTEXTO RECUPERADO: (nenhum trecho da biblioteca nem do PubMed cobriu esta pergunta)\n\nPERGUNTA DO USUÁRIO:\n${pergunta}`
    : `CONTEXTO RECUPERADO:\n${contexto}\n\nPERGUNTA DO USUÁRIO:\n${pergunta}`;

  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 1800,
    messages: [
      { role: "system", content: MEDICAL_ASSISTANT_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });
  let resposta = r.choices[0].message.content ?? "";

  // STEP 4 — guardrails: PMID inventado é removido; resposta clínica sem fonte recebe aviso.
  const pmidsReais = new Set(pubmed.map((p) => p.pmid));
  resposta = stripFabricatedPmids(resposta, pmidsReais).texto;
  resposta = garantirDisclaimer(resposta, lib.length > 0 || pubmed.length > 0);

  // STEP 5 — fontes para a UI (internas + PubMed), sem duplicar título.
  // Link da fonte interna: só expõe URL EXTERNA real (diretriz/DOI/site). NÃO linka o PDF
  // do livro no blob privado (dava "Forbidden" e exporia obra com direitos autorais) nem o
  // placeholder "/assistente": nesses casos o chip é só ATRIBUIÇÃO (de qual obra veio).
  const urlFonteSegura = (url: string | null): string | null => {
    if (!url || url === "/assistente") return null;
    if (url.includes("blob.vercel-storage.com") || url.startsWith("/api/img")) return null;
    return /^https?:\/\//i.test(url) ? url : null;
  };
  const vistas = new Set<string>();
  const fontes: Fonte[] = [];
  for (const t of lib) {
    if (t.fonte_titulo && !vistas.has(t.fonte_titulo)) {
      vistas.add(t.fonte_titulo);
      fontes.push({ titulo: t.fonte_titulo, url: urlFonteSegura(t.fonte_url), tipo: t.fonte_tipo });
    }
  }
  for (const p of pubmed) {
    const titulo = pubmedLabel(p);
    if (!vistas.has(titulo)) {
      vistas.add(titulo);
      fontes.push({ titulo, url: p.url, tipo: "pubmed", pmid: p.pmid });
    }
  }

  return { resposta, fontes, usouPubmed: pubmed.length > 0, semFonte };
}
