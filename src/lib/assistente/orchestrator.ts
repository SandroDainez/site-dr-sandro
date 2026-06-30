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

// Expansão de consulta: reescreve a pergunta numa busca clínica RICA (sinônimos, classes
// farmacológicas, termos relacionados, PT+EN). Sem isso, "clopidogrel" recuperava trechos
// perioperatórios em vez de SCA/antiagregação. Devolve [original, expandida]; em falha,
// só a original (fail-safe).
async function expandirConsulta(openai: OpenAI, pergunta: string): Promise<string[]> {
  try {
    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 120,
      messages: [{
        role: "user",
        content: `Reescreva a pergunta clínica abaixo como UMA consulta de busca rica para recuperar trechos de livros médicos. Inclua sinônimos, classes farmacológicas, condições e termos relacionados, e equivalentes em inglês. Responda só a consulta (uma linha, sem aspas).\n\nPergunta: ${pergunta}`,
      }],
    });
    const q = (r.choices[0].message.content ?? "").trim();
    return q && q.toLowerCase() !== pergunta.toLowerCase() ? [pergunta, q] : [pergunta];
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

  // STEP 1 — biblioteca interna, com EXPANSÃO de consulta (recupera bem mais e no tema certo)
  let lib: LibraryHit[] = [];
  try {
    const consultas = await expandirConsulta(openai, pergunta);
    const grupos = await Promise.all(
      consultas.map((q) => searchInternalLibrary(supabase, q, 12).catch(() => [] as LibraryHit[])),
    );
    lib = unirHits(grupos, 12);
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
    max_tokens: 1000,
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

  // STEP 5 — fontes para a UI (internas + PubMed), sem duplicar título
  const vistas = new Set<string>();
  const fontes: Fonte[] = [];
  for (const t of lib) {
    if (t.fonte_titulo && !vistas.has(t.fonte_titulo)) {
      vistas.add(t.fonte_titulo);
      fontes.push({ titulo: t.fonte_titulo, url: t.fonte_url, tipo: t.fonte_tipo });
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
