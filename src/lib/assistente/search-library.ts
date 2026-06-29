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

// True quando o melhor trecho interno é forte o suficiente para não precisar de PubMed.
export function libraryIsConfident(hits: LibraryHit[]): boolean {
  return hits.length > 0 && hits[0].score >= LIB_CONFIDENT;
}
