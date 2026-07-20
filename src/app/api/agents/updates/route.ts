import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, getDeepSeek, AI_MODELS, deepseekModel } from "@/lib/ai/openai";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import {
  getSemanaAtual, pubmedUrl, verificarCronSecret, PRINCIPIOS_AGENTE,
  MESH_QUERIES, ESPECIALIDADE_LABELS,
  RSS_FEEDS, RSS_TRANSVERSAIS,
  SITES_SOCIEDADES, SITES_REGULATORIOS_BR, SITES_SEGURANCA_PACIENTE,
  buscarLILACS, buscarSciELO, buscarOpenAlex,
  buscarClinicalTrials, buscarFDA, buscarNICE, buscarWHO,
} from "@/lib/agents/utils";
import type { Especialidade } from "@/types/medical";

export const maxDuration = 300; // agente longo: coleta multi-fonte + síntese

const ESPECIALIDADES: Especialidade[] = ["anestesiologia", "terapia_intensiva", "emergencias"];

// Item de fonte coletada (PubMed/RSS/sociedades/bases/regulatórios). Campos variam
// por origem, por isso quase tudo é opcional.
type Fonte = {
  origem: string;
  titulo?: string;
  journal?: string;
  pmid?: string;
  ano?: string;
  tipo?: string;
  tipoPub?: string;
  resumo?: string;
  url?: string;
  descricao?: string;
};

// Tópico do boletim gerado/revisado pela IA (JSON solto, campos opcionais).
type Topico = {
  titulo?: string;
  descricao?: string;
  relevancia_clinica?: string;
  pmid?: string | null;
  fonte_nome?: string;
  fonte_tipo?: string;
  nivel_evidencia?: string;
  fonte_url?: string | null;
};

// Síntese completa produzida pela IA.
type Sintese = {
  titulo?: string;
  resumo?: string;
  topicos?: Topico[];
};

// Item cru retornado pela web search (sociedades/regulatórios) antes de normalizar.
type ItemBusca = {
  titulo?: string;
  organizacao?: string;
  url?: string;
  tipo?: string;
  descricao?: string;
};

// Forma mínima da resposta de chat.completions que usamos.
type ChatCompletionResposta = { choices: { message: { content: string | null } }[] };

// SÍNTESE RESILIENTE: tenta OpenAI (gpt-4o); se falhar (ex.: cota/429 esgotada), cai no
// DeepSeek (mesmo SDK, já usado na geração do app). Assim o boletim semanal NÃO morre quando
// a cota da OpenAI acaba — foi exatamente o que deixou uma semana sem atualização. Devolve o
// conteúdo (string JSON) para o chamador dar JSON.parse. Fail-safe fica a cargo do chamador.
async function chatSintese(prompt: string, maxTokens: number, temperature: number): Promise<string> {
  const messages = [{ role: "user" as const, content: prompt }];
  const req = { messages, max_tokens: maxTokens, temperature, response_format: { type: "json_object" as const } };
  try {
    const r = await getOpenAI().chat.completions.create({ model: AI_MODELS.chat, ...req });
    return r.choices[0].message.content ?? "{}";
  } catch {
    const r = await getDeepSeek().chat.completions.create({ model: deepseekModel(), ...req });
    return r.choices[0].message.content ?? "{}";
  }
}

// ── CAMADA 1: PubMed ──────────────────────────────────────────────────────────
async function buscarPubMed(especialidade: string): Promise<Fonte[]> {
  const query = encodeURIComponent(MESH_QUERIES[especialidade]);
  const key = process.env.PUBMED_API_KEY ? `&api_key=${process.env.PUBMED_API_KEY}` : "";
  try {
    const r1 = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${query}&sort=relevance&datetype=pdat&reldate=14&retmax=8&retmode=json${key}`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!r1.ok) return [];
    const d1 = await r1.json();
    const ids: string[] = d1.esearchresult?.idlist ?? [];
    if (!ids.length) return [];
    const r2 = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json${key}`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!r2.ok) return [];
    const d2 = await r2.json();
    // Puxa os ABSTRACTS (efetch) para fundamentar a síntese no que o estudo realmente
    // diz — base da qualidade: a IA escreve do resumo real, não "adivinha" pelo título.
    const abstracts = await buscarAbstractsPubMed(ids, key);
    return ids.map((id): Fonte | null => {
      const a = d2.result?.[id];
      if (!a) return null;
      return {
        origem: "pubmed",
        pmid: id,
        titulo: a.title ?? "",
        journal: a.source ?? "",
        ano: a.pubdate?.substring(0, 4) ?? "",
        tipoPub: Array.isArray(a.pubtype) ? a.pubtype.join(", ") : (a.pubtype ?? ""),
        resumo: abstracts[id] ?? "",
        url: pubmedUrl(id),
      };
    }).filter((f): f is Fonte => f !== null);
  } catch {
    return [];
  }
}

// Abstracts do PubMed (efetch XML) → mapa pmid→resumo. Falha silenciosa (sem abstract
// o item ainda entra, só sem o texto). Extração leve por bloco de artigo.
async function buscarAbstractsPubMed(ids: string[], key: string): Promise<Record<string, string>> {
  try {
    const r = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=xml${key}`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!r.ok) return {};
    const xml = await r.text();
    const mapa: Record<string, string> = {};
    for (const bloco of xml.split(/<PubmedArticle[>\s]/).slice(1)) {
      const pmid = (bloco.match(/<PMID[^>]*>(\d+)<\/PMID>/) ?? [])[1];
      if (!pmid) continue;
      const partes = [...bloco.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)]
        .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim());
      if (partes.length) mapa[pmid] = partes.join(" ").slice(0, 900);
    }
    return mapa;
  } catch {
    return {};
  }
}

// ── CAMADA 2: RSS feeds ───────────────────────────────────────────────────────
async function parsearRSS(url: string, nomeJournal: string): Promise<Fonte[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MedUpdateBot/2.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const itens: Fonte[] = [];
    const regex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const b = match[1] || match[2];
      const titulo = b.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
      const link = b.match(/<link[^>]*href="([^"]+)"/)?.[1]
        || b.match(/<link[^>]*>(https?:\/\/[^<]+)<\/link>/)?.[1];
      const pubDate = b.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]
        || b.match(/<published>(.*?)<\/published>/)?.[1];
      if (titulo && link) {
        const data = pubDate ? new Date(pubDate) : null;
        const diasAtras = data ? (Date.now() - data.getTime()) / 86400000 : 0;
        if (!data || diasAtras <= 14) {
          itens.push({
            origem: "rss",
            titulo: titulo.replace(/&amp;/g, "&").replace(/<[^>]+>/g, "").trim(),
            journal: nomeJournal,
            url: link.trim(),
            ano: data?.getFullYear().toString() ?? new Date().getFullYear().toString(),
          });
        }
      }
      if (itens.length >= 3) break;
    }
    return itens;
  } catch {
    return [];
  }
}

async function buscarRSS(especialidade: string): Promise<Fonte[]> {
  const feeds = [...(RSS_FEEDS[especialidade] ?? []), ...RSS_TRANSVERSAIS];
  const resultados = await Promise.allSettled(feeds.map((f) => parsearRSS(f.url, f.nome)));
  return resultados
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<Fonte[]>).value)
    .slice(0, 18);
}

// ── CAMADA 3: Sites das sociedades — web search ───────────────────────────────
async function buscarSociedades(especialidade: string): Promise<Fonte[]> {
  const label = ESPECIALIDADE_LABELS[especialidade];
  const sociedades = SITES_SOCIEDADES[especialidade] ?? [];
  const lista = sociedades.map((s) => `${s.sigla} (${s.site})`).join(", ");
  try {
    const response = await (getOpenAI().chat.completions.create as unknown as (
      args: Record<string, unknown>
    ) => Promise<ChatCompletionResposta>)({
      model: AI_MODELS.search,
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `Pesquise guidelines, posicionamentos e comunicados científicos publicados nos últimos 14 dias pelas seguintes sociedades de ${label}: ${lista}

Para cada item encontrado retorne JSON array:
[{ "titulo": "...", "organizacao": "sigla", "url": "URL direta verificável", "tipo": "guideline|posicionamento|comunicado|atualizacao", "descricao": "1-2 frases" }]

Regra crítica: inclua APENAS itens com URL real e verificável. Omita itens sem URL.

Retorne APENAS o array JSON, sem markdown.`,
      }],
    });
    const texto = response.choices[0].message.content ?? "[]";
    const clean = texto.replace(/```json|```/g, "").trim();
    const dados: ItemBusca[] = JSON.parse(clean.startsWith("[") ? clean : `[${clean}]`);
    return dados.filter((d: ItemBusca) => d.url && d.titulo).map((d: ItemBusca) => ({
      origem: "sociedade",
      titulo: d.titulo,
      journal: d.organizacao ?? "",
      url: d.url,
      tipo: d.tipo ?? "atualizacao",
      descricao: d.descricao ?? "",
    }));
  } catch {
    return [];
  }
}

// ── CAMADA 4: Bases secundárias (todas em paralelo) ──────────────────────────
async function buscarBasesSecundarias(especialidade: string): Promise<Fonte[]> {
  const [lilacs, scielo, openalex, trials, fda, nice, who] = await Promise.allSettled([
    buscarLILACS(especialidade),
    buscarSciELO(especialidade),
    buscarOpenAlex(especialidade),
    buscarClinicalTrials(especialidade),
    buscarFDA(),
    buscarNICE(especialidade),
    buscarWHO(especialidade),
  ]).then((rs) => rs.map((r) => (r.status === "fulfilled" ? r.value : [])));
  return [...lilacs, ...scielo, ...openalex, ...trials, ...fda, ...nice, ...who] as Fonte[];
}

// ── CAMADA 5: Regulatórios brasileiros + segurança do paciente ────────────────
async function buscarRegulatoriosBR(especialidade: string): Promise<Fonte[]> {
  const label = ESPECIALIDADE_LABELS[especialidade];
  const listaBR = SITES_REGULATORIOS_BR.map((s) => `${s.sigla} (${s.site}): ${s.foco}`).join("\n");
  const listaSeg = SITES_SEGURANCA_PACIENTE.map((s) => `${s.sigla} (${s.site}): ${s.foco}`).join("\n");
  try {
    const response = await (getOpenAI().chat.completions.create as unknown as (
      args: Record<string, unknown>
    ) => Promise<ChatCompletionResposta>)({
      model: AI_MODELS.search,
      max_tokens: 1200,
      messages: [{
        role: "user",
        content: `Pesquise publicações, alertas e resoluções dos últimos 30 dias relevantes para ${label} nas seguintes fontes regulatórias e de segurança:

REGULATÓRIOS BRASILEIROS:
${listaBR}

SEGURANÇA DO PACIENTE (internacional):
${listaSeg}

Retorne JSON array:
[{ "titulo": "...", "organizacao": "sigla", "url": "URL real verificável", "tipo": "alerta|resolucao|nota_tecnica|guideline|boletim", "descricao": "1-2 frases" }]

Inclua APENAS itens com URL verificável. Retorne APENAS o array JSON.`,
      }],
    });
    const texto = response.choices[0].message.content ?? "[]";
    const clean = texto.replace(/```json|```/g, "").trim();
    const dados: ItemBusca[] = JSON.parse(clean.startsWith("[") ? clean : `[${clean}]`);
    return dados.filter((d: ItemBusca) => d.url && d.titulo).map((d: ItemBusca) => ({
      origem: "regulatorio",
      titulo: d.titulo,
      journal: d.organizacao ?? "",
      url: d.url,
      tipo: d.tipo ?? "regulatorio",
      descricao: d.descricao ?? "",
    }));
  } catch {
    return [];
  }
}

// ── SÍNTESE FINAL com GPT-4o ──────────────────────────────────────────────────
// Guarda ANTI-INVENÇÃO (no código, não confia só no prompt): garante que todo link
// e PMID de um tópico realmente exista nas fontes coletadas. Se o modelo inventou
// uma URL/PMID, ela é descartada — preferimos sem link a com link fabricado.
function sanearTopicos(topicos: Topico[], fontes: Fonte[]): Topico[] {
  const urlsReais = new Set(fontes.map((f) => String(f.url || "").trim().toLowerCase()).filter(Boolean));
  const pmidsReais = new Set(fontes.map((f) => String(f.pmid || "").trim()).filter(Boolean));
  return (Array.isArray(topicos) ? topicos : []).map((t) => {
    const pmid = t.pmid && pmidsReais.has(String(t.pmid).trim()) ? String(t.pmid).trim() : null;
    const urlOk = t.fonte_url && urlsReais.has(String(t.fonte_url).trim().toLowerCase());
    const fonte_url = urlOk
      ? t.fonte_url                       // URL real coletada → mantém
      : pmid ? pubmedUrl(pmid)            // tem PMID válido → link PubMed real
      : null;                            // senão, sem link (nunca fabricado)
    return { ...t, pmid, fonte_url };
  });
}

// Revisão ADVERSARIAL (2º passe, LLM-as-judge): um especialista sênior cético + editor
// confronta cada tópico com as fontes e DERRUBA o que estiver exagerado, não sustentado
// pela fonte, mal atribuído ou pouco relevante p/ especialista. Corrige imprecisões.
// Fail-safe: em erro/vazio devolve os tópicos originais (nunca zera a semana).
async function revisarTopicos(topicos: Topico[], fontesTexto: string, label: string): Promise<Topico[]> {
  if (!Array.isArray(topicos) || topicos.length === 0) return topicos ?? [];
  const prompt = `Você é um revisor SÊNIOR e CÉTICO de ${label} (nível editor de revista médica e parecerista de banca).

FONTES REAIS coletadas esta semana:
${fontesTexto}

TÓPICOS RASCUNHO (a revisar):
${JSON.stringify(topicos, null, 2)}

Sua tarefa, tópico por tópico, com rigor de banca:
- CONFRONTE cada afirmação com a fonte citada (campo fonte_url/pmid e os Resumos acima).
- REPROVE (remova) o tópico se: a afirmação NÃO é sustentada pela fonte; há exagero/extrapolação além do que o estudo mostra; atribuição errada (journal/sociedade); número/desfecho inventado; ou relevância baixa para um ESPECIALISTA brasileiro.
- Se aprovado, CORRIJA imprecisões: ajuste a descrição para refletir fielmente a fonte, tom sóbrio de evidência, sem hype. Mantenha fonte_url, pmid, fonte_nome, fonte_tipo e nivel_evidencia.
- Prefira QUALIDADE: melhor 2 tópicos sólidos do que 4 frouxos.

Retorne APENAS JSON: {"topicos": [ ...os aprovados e corrigidos, mesmos campos do rascunho... ]}`;
  try {
    const parsed = JSON.parse(await chatSintese(prompt, 2500, 0.1));
    const revisados = Array.isArray(parsed.topicos) ? parsed.topicos : [];
    return revisados.length > 0 ? revisados : topicos; // nunca zera a semana
  } catch {
    return topicos;
  }
}

// Reescreve o RESUMO do topo a partir dos tópicos JÁ FINALIZADOS (pós-revisão e
// saneamento). Sem isso, o resumo descrevia o rascunho antigo e ficava desconectado
// do que aparece embaixo. Fail-safe: em erro mantém o resumo original.
async function resumirDosTopicos(topicos: Topico[], label: string, semana: string, original: string): Promise<string> {
  if (!Array.isArray(topicos) || topicos.length === 0) return original;
  const lista = topicos.map((t, i) => `${i + 1}. ${t.titulo}${t.descricao ? ` — ${t.descricao}` : ""}`).join("\n");
  const prompt = `Estes são os tópicos FINAIS do boletim de ${label} desta semana (${semana}):

${lista}

Escreva um RESUMO de 2-3 frases que sintetize FIELMENTE o que está nesses tópicos — e somente eles. Não cite nada que não esteja na lista. Priorize, na ordem, novos guidelines/posicionamentos e alertas regulatórios. Tom sóbrio de evidência, sem hype. Retorne APENAS JSON: {"resumo": "..."}`;
  try {
    const parsed = JSON.parse(await chatSintese(prompt, 350, 0.2));
    return typeof parsed.resumo === "string" && parsed.resumo.trim() ? parsed.resumo.trim() : original;
  } catch {
    return original;
  }
}

// Revisão de PORTUGUÊS (último passe): corrige SÓ ortografia/acentuação/crase/gramática
// do texto PT-BR. NÃO toca em fatos, números, doses, unidades, nomes de fármacos/exames,
// siglas, sentido, ordem nem estrutura. Os campos de FONTE (fonte_url, pmid, nível,
// fonte_nome/tipo) são restaurados à força do original → o sistema de referências fica
// intocado. Fail-safe: qualquer erro/contagem divergente devolve o conteúdo sem alteração.
async function revisarPortugues(sintese: Sintese, label: string): Promise<Sintese> {
  try {
    const topicos: Topico[] = Array.isArray(sintese.topicos) ? sintese.topicos : [];
    // envia APENAS os campos de texto humano (nada de URL/PMID/nível)
    const payload = {
      resumo: sintese.resumo ?? "",
      topicos: topicos.map((t: Topico) => ({
        titulo: t.titulo ?? "",
        descricao: t.descricao ?? "",
        relevancia_clinica: t.relevancia_clinica ?? "",
      })),
    };
    const prompt = `Você é revisor de português do Brasil de um boletim clínico de ${label}.
Corrija APENAS erros de português: ortografia, acentuação, crase, concordância e pontuação.
NÃO altere fatos, números, doses, unidades, nomes de fármacos/exames, siglas, o sentido, a ordem nem a estrutura. NÃO traduza termos técnicos. O que já estiver correto, mantenha IDÊNTICO.
Devolva EXATAMENTE o mesmo JSON, com a MESMA quantidade de tópicos e MESMA ordem, só com o texto corrigido:
${JSON.stringify(payload, null, 2)}
Retorne APENAS JSON: {"resumo":"...","topicos":[{"titulo":"...","descricao":"...","relevancia_clinica":"..."}]}`;
    const parsed = JSON.parse(await chatSintese(prompt, 2500, 0));
    const revT = Array.isArray(parsed.topicos) ? parsed.topicos : [];
    if (revT.length !== topicos.length) return sintese; // desalinhou → não arrisca
    const txt = (novo: unknown, orig: string | undefined) =>
      typeof novo === "string" && novo.trim() ? novo.trim() : orig;
    return {
      ...sintese,
      resumo: txt(parsed.resumo, sintese.resumo ?? ""),
      topicos: topicos.map((t: Topico, i: number) => ({
        ...t, // preserva fonte_url, pmid, nivel_evidencia, fonte_nome, fonte_tipo etc.
        titulo: txt(revT[i]?.titulo, t.titulo),
        descricao: txt(revT[i]?.descricao, t.descricao),
        relevancia_clinica: txt(revT[i]?.relevancia_clinica, t.relevancia_clinica),
      })),
    };
  } catch {
    return sintese; // fail-safe: sem revisão, mantém original
  }
}

async function sintetizar(especialidade: string, todasFontes: Fonte[]): Promise<Sintese> {
  const label = ESPECIALIDADE_LABELS[especialidade];
  const semana = getSemanaAtual();
  const ordenadas = [
    ...todasFontes.filter((f) => f.origem === "regulatorio" || f.tipo === "guideline" || f.tipo === "posicionamento"),
    ...todasFontes.filter((f) => f.origem === "sociedade" && f.tipo !== "guideline"),
    ...todasFontes.filter((f) => ["pubmed", "rss", "openalex"].includes(f.origem)),
    ...todasFontes.filter((f) => ["lilacs", "scielo"].includes(f.origem)),
    ...todasFontes.filter((f) => ["clinicaltrials", "fda", "nice", "who"].includes(f.origem)),
  ].slice(0, 30);

  const fontesTexto = ordenadas.map((f, i) => {
    const pmid = f.pmid ? ` | PMID:${f.pmid}` : "";
    const tipo = f.tipo ? ` | [${f.tipo.toUpperCase()}]` : "";
    const tp = f.tipoPub ? ` | Tipo:${f.tipoPub}` : "";
    const org = f.origem !== "pubmed" && f.origem !== "rss" ? ` | Fonte:${f.origem}` : "";
    const resumo = f.resumo ? `\n    Resumo: ${f.resumo}` : "";
    return `[${i + 1}]${tipo} ${f.titulo} | ${f.journal || ""}${pmid}${tp}${org} | URL:${f.url}${resumo}`;
  }).join("\n");

  const prompt = `Você é especialista em ${label}, com foco em medicina baseada em evidências para médicos brasileiros especialistas.

${PRINCIPIOS_AGENTE}

Analise as seguintes atualizações reais coletadas de múltiplas fontes confiáveis (PubMed, journals especializados, sociedades médicas internacionais, LILACS/SciELO, regulatórios nacionais e internacionais):

${fontesTexto}

INSTRUÇÕES OBRIGATÓRIAS:
0. FUNDAMENTE cada tópico no "Resumo:" do item (quando houver). Descreva SÓ o que o resumo/título sustenta — não extrapole, não invente número, desfecho ou magnitude de efeito que não esteja na fonte. Sem exagero ("promissor"/"revolucionário"): tom sóbrio de evidência.
2. PRIORIZE itens marcados como [GUIDELINE], [POSICIONAMENTO], [ALERTA] ou [RESOLUCAO] — são clinicamente mais urgentes
3. Destaque itens de fontes regulatórias brasileiras (ANVISA, CFM, CONITEC, MS) — impacto direto na prática nacional
4. Para cada tópico, indique: PMID (se PubMed), sigla da sociedade ou órgão, ou nome do journal
5. Linguagem técnica, nível especialista — não explique conceitos básicos
6. Foco em implicações clínicas práticas e mudanças de conduta
6b. RELEVÂNCIA: inclua APENAS tópicos clinicamente relevantes para a prática de ${label}. Descarte itens administrativos, ambientais, de sustentabilidade ou tangenciais — a não ser que tenham impacto clínico/assistencial direto na ${label}. Cada tópico deve responder "o que muda na minha conduta?".
7. Tópicos: de 3 a 4 como NORMA — SEMPRE os MAIS RELEVANTES da semana (consolide itens correlatos num único tópico para evitar repetição). Em semanas com mais itens de alto impacto (novos guidelines, alertas regulatórios, mudanças de conduta), pode chegar a 6. NUNCA ultrapasse 6 nem inclua itens de baixa relevância só para encher — relevância clínica acima de quantidade. Semana fraca pode ter só 2-3.

Retorne APENAS JSON válido:
{
  "titulo": "Atualizações em ${label} — ${semana}",
  "resumo": "2-3 frases destacando os achados mais relevantes, priorizando novos guidelines e alertas regulatórios",
  "topicos": [
    // 3-4 como norma (até 6 em semanas de alto impacto), sempre os mais relevantes
    {
      "titulo": "título objetivo e informativo",
      "descricao": "descrição técnica dos achados (3-5 frases)",
      "relevancia_clinica": "impacto direto na prática clínica (2-3 frases)",
      "pmid": "PMID se disponível, senão null",
      "fonte_nome": "nome do journal, sigla da sociedade ou órgão",
      "fonte_tipo": "journal | guideline | posicionamento | alerta | resolucao | trial | regulatorio",
      "nivel_evidencia": "classifique a evidência da fonte: 'Diretriz/Guideline' | 'Posicionamento de sociedade' | 'Ensaio clínico randomizado' | 'Revisão sistemática/Metanálise' | 'Coorte/Observacional' | 'Regulatório/Alerta' | 'Revisão narrativa' | 'Preprint/Preliminar'",
      "fonte_url": "a URL EXATA do item da lista acima que originou este tópico (copie o campo URL: do item). Obrigatório."
    }
  ]
}`;

  let tentativas = 0;
  while (tentativas < 3) {
    try {
      const parsed = JSON.parse(await chatSintese(prompt, 2500, 0.2));
      // Pipeline de qualidade: revisão adversarial (derruba exagero/não sustentado) →
      // guarda de links (descarta URL/PMID que não exista nas fontes coletadas).
      parsed.topicos = await revisarTopicos(parsed.topicos ?? [], fontesTexto, label);
      parsed.topicos = sanearTopicos(parsed.topicos ?? [], ordenadas);
      // resumo do topo SEMPRE reescrito a partir dos tópicos finais (senão fica desconectado)
      parsed.resumo = await resumirDosTopicos(parsed.topicos ?? [], label, semana, parsed.resumo ?? "");
      // último passe: revisão de português (só o texto; referências preservadas à força)
      return await revisarPortugues(parsed, label);
    } catch (err) {
      tentativas++;
      if (tentativas === 3) throw err;
      await new Promise((res) => setTimeout(res, 2000 * tentativas));
    }
  }
  throw new Error("sintetizar: falha após 3 tentativas"); // inalcançável (loop sempre retorna/lança)
}

// ── ROUTE HANDLER ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!verificarCronSecret(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!serviceConfigured() || !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Supabase ou OpenAI não configurados" }, { status: 503 });
  }

  const supabase = createServiceClient();
  const semana = getSemanaAtual();
  const resultados: Record<string, unknown> = {};

  for (const especialidade of ESPECIALIDADES) {
    try {
      const { data: existente } = await supabase
        .from("medical_updates")
        .select("id")
        .eq("especialidade", especialidade)
        .eq("semana_referencia", semana)
        .maybeSingle();

      if (existente) {
        resultados[especialidade] = { status: "já existe para esta semana" };
        continue;
      }

      const [pubmedItems, rssItems, sociedadeItems, secundariasItems, regulatoriosItems] =
        await Promise.allSettled([
          buscarPubMed(especialidade),
          buscarRSS(especialidade),
          buscarSociedades(especialidade),
          buscarBasesSecundarias(especialidade),
          buscarRegulatoriosBR(especialidade),
        ]).then((rs) => rs.map((r) => (r.status === "fulfilled" ? r.value : [])));

      const todasFontes = [
        ...pubmedItems, ...rssItems, ...sociedadeItems, ...secundariasItems, ...regulatoriosItems,
      ].filter(Boolean);

      if (todasFontes.length === 0) {
        resultados[especialidade] = { status: "nenhuma fonte encontrada" };
        continue;
      }

      const sintese = await sintetizar(especialidade, todasFontes);

      const fontesParaSalvar = todasFontes.map((f) => ({
        titulo: f.titulo,
        journal: f.journal ?? "",
        pmid: f.pmid ?? null,
        url: f.url,
        ano: f.ano ? parseInt(f.ano) : null,
        origem: f.origem,
        tipo: f.tipo ?? null,
      }));

      const { error } = await supabase.from("medical_updates").insert({
        especialidade,
        titulo: sintese.titulo,
        resumo: sintese.resumo,
        topicos: sintese.topicos ?? [],
        fontes: fontesParaSalvar,
        semana_referencia: semana,
        publicado: true,
      });

      if (error) throw error;

      resultados[especialidade] = {
        status: "ok",
        fontes: {
          pubmed: pubmedItems.length,
          rss: rssItems.length,
          sociedades: sociedadeItems.length,
          bases: secundariasItems.length,
          regulatorios: regulatoriosItems.length,
          total: todasFontes.length,
        },
        topicos: sintese.topicos?.length ?? 0,
      };
    } catch (err) {
      console.error(`[UPDATES][${especialidade}] Erro:`, err);
      resultados[especialidade] = { status: "erro", mensagem: (err as { message?: string })?.message };
    }
  }

  return NextResponse.json({ semana, resultados });
}

// Vercel cron dispara via GET e injeta `Authorization: Bearer $CRON_SECRET`.
// Repassamos para o POST, que valida o secret — sem brecha pública.
export async function GET(request: NextRequest) {
  return POST(request);
}
