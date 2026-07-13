import { corrigirCitacoes } from "./correcao";
import { normalizar, consolidarValidacao, type Validacao } from "./citations";
import { searchPubMed } from "@/lib/assistente/search-pubmed";
import { getOpenAI } from "./openai";
import type { Source, SecaoGerada } from "./types";

// Fluxo COMPARTILHADO de "Aplicar correções" com fallback no PubMed, para todos os módulos da
// Editora (arquiteto, editor científico/premium, aulas, flashcards, questões…). Padrão idêntico
// entre módulos: só muda o prompt de correção e como cada um anexa uma fonte. Injetamos os dois.
//
// Passo 1: reancorar nas fontes já anexadas (biblioteca). Passo 2: o que sobrar sem âncora é
// buscado no PubMed (abstract REAL), anexado como fonte e reancorado. O código revalida sempre
// (âncora inventada não conta) — nada é inventado; o que não sustentar fica marcado.

export type ItemCorrigir = { id: string; secao: string; texto: string; tipo: string };
export type PubmedHitMin = { pmid: string; titulo: string; autores: string; ano: string; resumo: string };

export type CorrecaoResultado = {
  secoes: SecaoGerada[]; validacao: Validacao; corrigidas: number; total: number; fontesExternas: number;
};

export async function aplicarCorrecoesComPubMed(args: {
  secoes: SecaoGerada[];
  sources: Source[];
  buildPrompt: (itens: ItemCorrigir[], sources: Source[]) => string;
  // Anexa a fonte do PubMed no módulo (tabela própria) e devolve a Source com id — ou null se falhar.
  adicionarFonte: (hit: PubmedHitMin) => Promise<Source | null>;
}): Promise<CorrecaoResultado> {
  const { secoes, buildPrompt, adicionarFonte } = args;
  const sources = [...args.sources]; // pode crescer com fontes do PubMed

  let mapa = new Map(sources.map((s) => [s.id, normalizar(s.texto)]));
  const rebuildMapa = () => { mapa = new Map(sources.map((s) => [s.id, normalizar(s.texto)])); };
  const reprovada = (a: SecaoGerada["afirmacoes"][number]) => {
    if (a.tipo !== "clinica" && a.tipo !== "dose") return false;
    if (a.conferido) return false; // conferida pelo médico → não reancorar
    const txt = a.source_id ? mapa.get(a.source_id) : undefined;
    const anc = normalizar(a.ancora ?? "");
    return !(a.source_id && txt !== undefined && anc && txt.includes(anc));
  };

  const novo: SecaoGerada[] = secoes.map((sec) => ({ ...sec, afirmacoes: (sec.afirmacoes ?? []).map((a) => ({ ...a })) }));
  const itensDe = (): ItemCorrigir[] => {
    const out: ItemCorrigir[] = [];
    novo.forEach((sec, si) => (sec.afirmacoes ?? []).forEach((a, ai) => {
      if (reprovada(a)) out.push({ id: `${si}:${ai}`, secao: sec.secao, texto: a.texto, tipo: a.tipo });
    }));
    return out;
  };
  const aplicar = (correcoes: Awaited<ReturnType<typeof corrigirCitacoes>>["correcoes"]) => {
    for (const c of correcoes) {
      const [si, ai] = c.id.split(":").map((n) => parseInt(n, 10));
      const alvo = novo[si]?.afirmacoes?.[ai];
      if (!alvo) continue;
      alvo.texto = c.texto ?? alvo.texto;
      alvo.source_id = c.source_id ?? null;
      alvo.ancora = c.ancora ?? null;
      alvo.tipo = c.tipo ?? alvo.tipo;
    }
  };

  const itensIniciais = itensDe();
  const total = itensIniciais.length;
  if (total === 0) {
    return { secoes, validacao: consolidarValidacao(secoes, sources), corrigidas: 0, total: 0, fontesExternas: 0 };
  }

  // Passo 1 — reancorar na biblioteca.
  const p1 = await corrigirCitacoes({ itens: itensIniciais, sources, prompt: buildPrompt(itensIniciais, sources) });
  aplicar(p1.correcoes);

  // Passo 2 — PubMed pro que sobrou.
  let fontesExternas = 0;
  const restantes = itensDe();
  if (restantes.length > 0) {
    let openai: ReturnType<typeof getOpenAI> | null = null;
    try { openai = getOpenAI(); } catch { openai = null; }
    if (openai) {
      const pmids = new Set<string>();
      for (const item of restantes.slice(0, 12)) {
        let hits: Awaited<ReturnType<typeof searchPubMed>> = [];
        try { hits = await searchPubMed(openai, item.texto); } catch { hits = []; }
        const hit = hits.find((h) => h.resumo && h.resumo.trim().length > 40 && !pmids.has(h.pmid));
        if (!hit) continue;
        const s = await adicionarFonte({ pmid: hit.pmid, titulo: hit.titulo, autores: hit.autores, ano: hit.ano, resumo: hit.resumo });
        if (s) { sources.push(s); pmids.add(hit.pmid); fontesExternas++; }
      }
      if (fontesExternas > 0) {
        rebuildMapa();
        const itens2 = itensDe();
        if (itens2.length > 0) {
          const p2 = await corrigirCitacoes({ itens: itens2, sources, prompt: buildPrompt(itens2, sources) });
          aplicar(p2.correcoes);
        }
      }
    }
  }

  rebuildMapa();
  const validacao = consolidarValidacao(novo, sources);
  const aindaReprovada = new Set(itensDe().map((i) => i.id));
  const corrigidas = itensIniciais.filter((i) => !aindaReprovada.has(i.id)).length;
  return { secoes: novo, validacao, corrigidas, total, fontesExternas };
}
