import type { Source } from "../types";
import { getOpenAI } from "../openai";
import { createServiceClient } from "@/lib/supabase/server";
import { searchInternalLibrary } from "@/lib/assistente/search-library";
import { searchPubMed } from "@/lib/assistente/search-pubmed";

// Camada de RETRIEVAL compartilhada pelos módulos 7/8/9. Busca a BIBLIOTECA INTERNA
// (kb_chunks via hybrid_search) SEMPRE, e o PubMed quando pedido. Cada resultado vira um
// Source (texto real = trecho/abstract) → alimenta o MESMO pipeline anti-alucinação
// (as citações são validadas verbatim contra este texto → confidence idêntico). Cacheia
// os resultados por consulta (tabela retrieval_cache, com TTL) p/ não rebuscar/repagar.

export type Evidencias = { sources: Source[]; internos: number; pubmed: number; fromCache: boolean };

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function chaveCache(tema: string, incluirPubmed: boolean): string {
  return `v1|${incluirPubmed ? "p" : "-"}|${tema.trim().toLowerCase().slice(0, 300)}`;
}

type ServiceClient = ReturnType<typeof createServiceClient>;

async function lerCache(supabase: ServiceClient, key: string): Promise<Source[] | null> {
  const { data } = await supabase.from("retrieval_cache").select("results,created_at").eq("cache_key", key).maybeSingle();
  if (!data) return null;
  const idade = Date.now() - new Date(data.created_at as string).getTime();
  if (idade > TTL_MS) return null;
  return (data.results as Source[]) ?? null;
}

async function gravarCache(supabase: ServiceClient, key: string, sources: Source[], meta: Record<string, unknown>) {
  await supabase.from("retrieval_cache").upsert(
    { cache_key: key, results: sources, meta, created_at: new Date().toISOString() },
    { onConflict: "cache_key" },
  );
}

export async function buscarEvidencias(input: {
  tema: string;
  incluirPubmed?: boolean;
  limiteInterno?: number;
}): Promise<Evidencias> {
  const tema = (input.tema || "").trim();
  const incluirPubmed = input.incluirPubmed !== false;
  const limiteInterno = input.limiteInterno ?? 8;
  if (!tema) return { sources: [], internos: 0, pubmed: 0, fromCache: false };

  const supabase = createServiceClient();
  const key = chaveCache(tema, incluirPubmed);

  const cached = await lerCache(supabase, key);
  if (cached) {
    const internos = cached.filter((s) => s.tipo === "biblioteca").length;
    return { sources: cached, internos, pubmed: cached.length - internos, fromCache: true };
  }

  // 1) Biblioteca interna (sempre).
  const sources: Source[] = [];
  try {
    const hits = await searchInternalLibrary(supabase, tema, limiteInterno);
    hits.filter((h) => h.conteudo.trim()).forEach((h, i) => {
      sources.push({
        id: `INT${i + 1}`,
        titulo: h.fonte_titulo || "Biblioteca interna",
        tipo: "biblioteca",
        texto: h.conteudo,
        url: h.fonte_url ?? undefined,
      });
    });
  } catch { /* biblioteca indisponível → segue só com externo */ }
  const internos = sources.length;

  // 2) PubMed (opcional) — PMIDs reais.
  if (incluirPubmed) {
    try {
      const hits = await searchPubMed(getOpenAI(), tema);
      hits.filter((h) => (h.resumo || "").trim()).forEach((h) => {
        sources.push({
          id: `PMID${h.pmid}`,
          titulo: h.titulo,
          tipo: "pubmed",
          autor: h.autores || undefined,
          ano: h.ano ? parseInt(h.ano, 10) || null : null,
          texto: h.resumo,
          url: h.url,
        });
      });
    } catch { /* PubMed indisponível → segue só com a biblioteca interna */ }
  }
  const pubmed = sources.length - internos;

  await gravarCache(supabase, key, sources, { internos, pubmed, tema });
  return { sources, internos, pubmed, fromCache: false };
}
