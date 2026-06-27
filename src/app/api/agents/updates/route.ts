import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import {
  getSemanaAtual, pubmedUrl, verificarCronSecret,
  MESH_QUERIES, ESPECIALIDADE_LABELS,
  RSS_FEEDS, RSS_TRANSVERSAIS,
  SITES_SOCIEDADES, SITES_REGULATORIOS_BR, SITES_SEGURANCA_PACIENTE,
  buscarLILACS, buscarSciELO, buscarOpenAlex,
  buscarClinicalTrials, buscarFDA, buscarNICE, buscarWHO,
} from "@/lib/agents/utils";
import type { Especialidade } from "@/types/medical";

export const maxDuration = 300; // agente longo: coleta multi-fonte + síntese

const ESPECIALIDADES: Especialidade[] = ["anestesiologia", "terapia_intensiva", "emergencias"];

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── CAMADA 1: PubMed ──────────────────────────────────────────────────────────
async function buscarPubMed(especialidade: string): Promise<any[]> {
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
    return ids.map((id) => {
      const a = d2.result?.[id];
      if (!a) return null;
      return {
        origem: "pubmed",
        pmid: id,
        titulo: a.title ?? "",
        journal: a.source ?? "",
        ano: a.pubdate?.substring(0, 4) ?? "",
        url: pubmedUrl(id),
      };
    }).filter(Boolean);
  } catch {
    return [];
  }
}

// ── CAMADA 2: RSS feeds ───────────────────────────────────────────────────────
async function parsearRSS(url: string, nomeJournal: string): Promise<any[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MedUpdateBot/2.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const itens: any[] = [];
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

async function buscarRSS(especialidade: string): Promise<any[]> {
  const feeds = [...(RSS_FEEDS[especialidade] ?? []), ...RSS_TRANSVERSAIS];
  const resultados = await Promise.allSettled(feeds.map((f) => parsearRSS(f.url, f.nome)));
  return resultados
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<any[]>).value)
    .slice(0, 18);
}

// ── CAMADA 3: Sites das sociedades — web search ───────────────────────────────
async function buscarSociedades(especialidade: string): Promise<any[]> {
  const label = ESPECIALIDADE_LABELS[especialidade];
  const sociedades = SITES_SOCIEDADES[especialidade] ?? [];
  const lista = sociedades.map((s) => `${s.sigla} (${s.site})`).join(", ");
  try {
    const response = await (getOpenAI().chat.completions.create as any)({
      model: "gpt-4o-search-preview",
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
    const dados = JSON.parse(clean.startsWith("[") ? clean : `[${clean}]`);
    return dados.filter((d: any) => d.url && d.titulo).map((d: any) => ({
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
async function buscarBasesSecundarias(especialidade: string): Promise<any[]> {
  const [lilacs, scielo, openalex, trials, fda, nice, who] = await Promise.allSettled([
    buscarLILACS(especialidade),
    buscarSciELO(especialidade),
    buscarOpenAlex(especialidade),
    buscarClinicalTrials(especialidade),
    buscarFDA(),
    buscarNICE(especialidade),
    buscarWHO(especialidade),
  ]).then((rs) => rs.map((r) => (r.status === "fulfilled" ? r.value : [])));
  return [...lilacs, ...scielo, ...openalex, ...trials, ...fda, ...nice, ...who];
}

// ── CAMADA 5: Regulatórios brasileiros + segurança do paciente ────────────────
async function buscarRegulatoriosBR(especialidade: string): Promise<any[]> {
  const label = ESPECIALIDADE_LABELS[especialidade];
  const listaBR = SITES_REGULATORIOS_BR.map((s) => `${s.sigla} (${s.site}): ${s.foco}`).join("\n");
  const listaSeg = SITES_SEGURANCA_PACIENTE.map((s) => `${s.sigla} (${s.site}): ${s.foco}`).join("\n");
  try {
    const response = await (getOpenAI().chat.completions.create as any)({
      model: "gpt-4o-search-preview",
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
    const dados = JSON.parse(clean.startsWith("[") ? clean : `[${clean}]`);
    return dados.filter((d: any) => d.url && d.titulo).map((d: any) => ({
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
async function sintetizar(especialidade: string, todasFontes: any[]): Promise<any> {
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
    const org = f.origem !== "pubmed" && f.origem !== "rss" ? ` | Fonte:${f.origem}` : "";
    return `[${i + 1}]${tipo} ${f.titulo} | ${f.journal || ""}${pmid}${org} | URL:${f.url}`;
  }).join("\n");

  const prompt = `Você é especialista em ${label}, com foco em medicina baseada em evidências para médicos brasileiros especialistas.

Analise as seguintes atualizações reais coletadas de múltiplas fontes confiáveis (PubMed, journals especializados, sociedades médicas internacionais, LILACS/SciELO, regulatórios nacionais e internacionais):

${fontesTexto}

INSTRUÇÕES OBRIGATÓRIAS:
1. Use APENAS as informações dos itens listados — nunca invente referências
2. PRIORIZE itens marcados como [GUIDELINE], [POSICIONAMENTO], [ALERTA] ou [RESOLUCAO] — são clinicamente mais urgentes
3. Destaque itens de fontes regulatórias brasileiras (ANVISA, CFM, CONITEC, MS) — impacto direto na prática nacional
4. Para cada tópico, indique: PMID (se PubMed), sigla da sociedade ou órgão, ou nome do journal
5. Linguagem técnica, nível especialista — não explique conceitos básicos
6. Foco em implicações clínicas práticas e mudanças de conduta
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
      "fonte_tipo": "journal | guideline | posicionamento | alerta | resolucao | trial | regulatorio"
    }
  ]
}`;

  let tentativas = 0;
  while (tentativas < 3) {
    try {
      const r = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2500,
        temperature: 0.2,
        response_format: { type: "json_object" },
      });
      return JSON.parse(r.choices[0].message.content ?? "{}");
    } catch (err) {
      tentativas++;
      if (tentativas === 3) throw err;
      await new Promise((res) => setTimeout(res, 2000 * tentativas));
    }
  }
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
  const resultados: Record<string, any> = {};

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
    } catch (err: any) {
      console.error(`[UPDATES][${especialidade}] Erro:`, err);
      resultados[especialidade] = { status: "erro", mensagem: err.message };
    }
  }

  return NextResponse.json({ semana, resultados });
}

// Vercel cron dispara via GET e injeta `Authorization: Bearer $CRON_SECRET`.
// Repassamos para o POST, que valida o secret — sem brecha pública.
export async function GET(request: NextRequest) {
  return POST(request);
}
