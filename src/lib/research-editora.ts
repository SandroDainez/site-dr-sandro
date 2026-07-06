import { createPublicClient, serviceConfigured } from "@/lib/supabase/server";
import type { SecaoGerada } from "@/lib/ai/types";

// Leitura PÚBLICA dos documentos de retrieval-síntese (research_docs/research_versions),
// compartilhada por #8 Comparador e #9 Pesquisador (distinguidos por `tipo`). Cliente
// ANÔNIMO → RLS só devolve o publicado. Migration 009.

export type ResearchTipo = "comparador" | "pesquisador";

export type ResearchResumo = { id: string; title: string; slug: string; specialty: string };

export type ReferenciaSnapshot = { id: string; titulo: string; tipo: string; autor?: string; ano?: number | null; url?: string };

export type ResearchConteudo = {
  especialidade?: string;
  tema?: string;
  secoes?: SecaoGerada[];
  textoEditado?: Record<string, string>;
  referencias?: ReferenciaSnapshot[];
  confidence?: number;
  confidence_method?: string;
};

export type ResearchPublico = {
  id: string;
  title: string;
  slug: string;
  specialty: string;
  publicado_em: string | null;
  conteudo: ResearchConteudo;
};

export async function getResearchPublicados(tipo: ResearchTipo): Promise<ResearchResumo[]> {
  if (!serviceConfigured()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from("research_docs").select("id,title,slug,specialty").eq("tipo", tipo).eq("status", "published").order("updated_at", { ascending: false });
    return (data as ResearchResumo[]) ?? [];
  } catch {
    return [];
  }
}

export async function getResearchPublicado(tipo: ResearchTipo, slug: string): Promise<ResearchPublico | null> {
  if (!serviceConfigured()) return null;
  try {
    const supabase = createPublicClient();
    const { data: doc } = await supabase
      .from("research_docs")
      .select("id,title,slug,specialty,updated_at")
      .eq("tipo", tipo)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!doc) return null;

    const { data: ver } = await supabase
      .from("research_versions")
      .select("content,created_at")
      .eq("doc_id", doc.id)
      .eq("is_published", true)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      specialty: doc.specialty,
      publicado_em: ver?.created_at ?? null,
      conteudo: (ver?.content as ResearchConteudo) ?? {},
    };
  } catch {
    return null;
  }
}
