import type OpenAI from "openai";
import { AI_MODELS } from "@/lib/ai/openai";
import { pubmedUrl } from "@/lib/agents/utils";

// Busca no PubMed (E-utilities) — só roda quando a biblioteca interna não cobre.
// Todo PMID é REAL (vem do esearch/esummary/efetch) — nunca fabricado.

export type PubmedHit = {
  pmid: string;
  titulo: string;
  autores: string;
  journal: string;
  ano: string;
  resumo: string;
  url: string;
};

const apiKeyParam = () => (process.env.PUBMED_API_KEY ? `&api_key=${process.env.PUBMED_API_KEY}` : "");

// Shape parcial de um registro de esummary do PubMed (só os campos que lemos).
type PubmedSummary = {
  title?: string;
  source?: string;
  pubdate?: string;
  authors?: { name?: string }[];
};

// Pergunta em PT → termo de busca enxuto em inglês (o recall do PubMed cai muito
// em português). Falha → usa a própria pergunta. gpt-4o-mini para custo baixo.
export async function buildPubmedQuery(openai: OpenAI, perguntaPT: string): Promise<string> {
  try {
    const r = await openai.chat.completions.create({
      model: AI_MODELS.chatMini,
      temperature: 0,
      max_tokens: 60,
      messages: [{
        role: "user",
        content: `Converta a pergunta clínica em uma query curta de busca no PubMed, em inglês, só com os termos essenciais (sem aspas, sem operadores, sem explicação). Pergunta: "${perguntaPT}"`,
      }],
    });
    const q = (r.choices[0].message.content ?? "").trim().replace(/^["']|["']$/g, "");
    return q.length >= 3 ? q : perguntaPT;
  } catch {
    return perguntaPT;
  }
}

async function esearch(term: string, comFiltro: boolean): Promise<string[]> {
  // Filtro preferencial: guidelines, metanálises, revisões sistemáticas, RCTs, últimos 5 anos.
  const filtro = comFiltro
    ? ` AND (Guideline[ptyp] OR Meta-Analysis[ptyp] OR systematic[sb] OR Randomized Controlled Trial[ptyp] OR Practice Guideline[ptyp])`
    : "";
  const reldate = comFiltro ? `&datetype=pdat&reldate=1825` : "";
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term + filtro)}&retmax=10&sort=relevance&retmode=json${reldate}${apiKeyParam()}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) return [];
  const d = await r.json();
  return (d.esearchresult?.idlist ?? []) as string[];
}

async function esummary(ids: string[]): Promise<Record<string, PubmedSummary>> {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json${apiKeyParam()}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) return {};
  const d = await r.json();
  return d.result ?? {};
}

// Abstracts (efetch XML) → mapa pmid→resumo. Falha silenciosa.
async function efetchAbstracts(ids: string[]): Promise<Record<string, string>> {
  try {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=xml${apiKeyParam()}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
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

function autoresDe(a: PubmedSummary | undefined): string {
  const nomes: string[] = Array.isArray(a?.authors) ? a.authors.map((x) => x?.name).filter((n): n is string => Boolean(n)) : [];
  if (nomes.length === 0) return "";
  return nomes.length <= 3 ? nomes.join(", ") : `${nomes.slice(0, 3).join(", ")} et al.`;
}

export async function searchPubMed(openai: OpenAI, perguntaPT: string): Promise<PubmedHit[]> {
  try {
    const termo = await buildPubmedQuery(openai, perguntaPT);
    // 1) busca com filtro de qualidade (guideline/metanálise/RCT, últimos 5 anos).
    let ids = await esearch(termo, true);
    // 2) se veio POUCO (não só zero), amplia com a busca sem filtro e une (sem duplicar) —
    // preserva a prioridade das fontes de melhor qualidade, mas não trava a síntese em 1-2 fontes.
    if (ids.length < 5) {
      const amplos = await esearch(termo, false);
      ids = [...ids, ...amplos.filter((id) => !ids.includes(id))].slice(0, 10);
    }
    if (ids.length === 0) return [];

    const [resumo, abstracts] = await Promise.all([esummary(ids), efetchAbstracts(ids)]);
    return ids
      .map((id) => {
        const a = resumo[id];
        if (!a || !a.title) return null;
        return {
          pmid: id,
          titulo: String(a.title).replace(/\.$/, ""),
          autores: autoresDe(a),
          journal: a.source ?? "",
          ano: (a.pubdate ?? "").toString().slice(0, 4),
          resumo: abstracts[id] ?? "",
          url: pubmedUrl(id),
        } as PubmedHit;
      })
      .filter((x): x is PubmedHit => x !== null);
  } catch {
    return [];
  }
}
