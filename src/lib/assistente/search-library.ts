import { embedUm, toVector } from "@/lib/agents/embeddings";

// Busca semântica na BIBLIOTECA INTERNA (pgvector via RPC match_kb) — sempre a 1ª fonte.
//
// Thresholds calibrados para text-embedding-3-small (cosine): trechos relevantes
// costumam ficar ~0.3–0.5; os do spec (0.75/0.85) rejeitariam quase tudo.
// FLOOR  = relevante o bastante p/ entrar no contexto do LLM.
// CONFIDENT = forte o bastante p/ DISPENSAR a busca no PubMed.
export const LIB_FLOOR = 0.22;
export const LIB_CONFIDENT = 0.42;

export type LibraryHit = {
  conteudo: string;
  fonte_tipo: string;
  fonte_titulo: string | null;
  fonte_url: string | null;
  score: number;
};

type SupabaseLike = { rpc: (fn: string, args: Record<string, unknown>) => any };

export async function searchInternalLibrary(
  supabase: SupabaseLike,
  query: string,
  limit = 8,
): Promise<LibraryHit[]> {
  const vec = await embedUm(query);
  const { data } = await supabase.rpc("match_kb", { query_embedding: toVector(vec), match_count: limit });
  return (data ?? [])
    .map((t: any) => ({
      conteudo: String(t.conteudo ?? ""),
      fonte_tipo: String(t.fonte_tipo ?? ""),
      fonte_titulo: t.fonte_titulo ?? null,
      fonte_url: t.fonte_url ?? null,
      score: Number(t.similaridade ?? 0),
    }))
    .filter((t: LibraryHit) => t.score >= LIB_FLOOR);
}

// True quando a biblioteca interna cobre BEM a pergunta — só então dispensamos o PubMed.
// Exige o melhor trecho forte E pelo menos 2 trechos acima do CONFIDENT: assim um único
// trecho tangencial (ex.: "clopidogrel" caindo num trecho perioperatório) NÃO bloqueia a
// busca de diretrizes no PubMed.
export function libraryIsConfident(hits: LibraryHit[]): boolean {
  if (hits.length === 0 || hits[0].score < LIB_CONFIDENT) return false;
  return hits.filter((h) => h.score >= LIB_CONFIDENT).length >= 2;
}

// Une resultados de várias consultas (expansão semântica): dedup por conteúdo,
// mantém o MAIOR score de cada trecho e ordena do mais forte ao mais fraco.
export function unirHits(grupos: LibraryHit[][], limit = 12): LibraryHit[] {
  const porChave = new Map<string, LibraryHit>();
  for (const g of grupos) for (const h of g) {
    const chave = h.conteudo.slice(0, 200);
    const atual = porChave.get(chave);
    if (!atual || h.score > atual.score) porChave.set(chave, h);
  }
  return [...porChave.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
