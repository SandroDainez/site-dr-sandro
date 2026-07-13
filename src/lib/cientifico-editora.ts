import { createPublicClient, serviceConfigured } from "@/lib/supabase/server";
import type { SecaoGerada } from "@/lib/ai/types";

// Leitura PÚBLICA dos textos científicos da Editora (sci_docs + sci_versions).
// Usa o cliente ANÔNIMO de propósito → a RLS garante que só o publicado apareça
// (sci_docs.status='published' + sci_versions.is_published=true). Ver migration 004.

export type CientificoPublicoResumo = { id: string; title: string; slug: string; specialty: string; areas: string[] };

export type ReferenciaSnapshot = { id: string; titulo: string; tipo: string; autor?: string; ano?: number | null };

export type CientificoConteudo = {
  especialidade?: string;
  secoes?: SecaoGerada[];
  textoEditado?: Record<string, string>;
  referencias?: ReferenciaSnapshot[];
  confidence?: number;
  confidence_method?: string;
};

export type CientificoPublico = {
  id: string;
  title: string;
  slug: string;
  specialty: string;
  publicado_em: string | null;
  conteudo: CientificoConteudo;
};

export async function getCientificosPublicados(): Promise<CientificoPublicoResumo[]> {
  if (!serviceConfigured()) return [];
  try {
    const supabase = createPublicClient(); // anon → RLS só devolve status='published'
    const { data } = await supabase.from("sci_docs").select("id,title,slug,specialty,areas").eq("status", "published").order("updated_at", { ascending: false });
    return (data as CientificoPublicoResumo[]) ?? [];
  } catch {
    return [];
  }
}

export async function getCientificoPublicado(slug: string): Promise<CientificoPublico | null> {
  if (!serviceConfigured()) return null;
  try {
    const supabase = createPublicClient(); // anon → RLS
    const { data: doc } = await supabase
      .from("sci_docs")
      .select("id,title,slug,specialty,updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!doc) return null;

    const { data: ver } = await supabase
      .from("sci_versions")
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
      conteudo: (ver?.content as CientificoConteudo) ?? {},
    };
  } catch {
    return null;
  }
}
