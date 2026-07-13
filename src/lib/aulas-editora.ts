import { createPublicClient, serviceConfigured } from "@/lib/supabase/server";
import type { SecaoGerada } from "@/lib/ai/types";

// Leitura PÚBLICA das aulas da Editora (aula_docs + aula_versions). Cliente ANÔNIMO →
// a RLS garante que só o publicado apareça (status='published' + is_published=true). Migration 005.

export type AulaPublicaResumo = { id: string; title: string; slug: string; specialty: string; areas: string[] };

export type ReferenciaSnapshot = { id: string; titulo: string; tipo: string; autor?: string; ano?: number | null };

export type AulaConteudo = {
  especialidade?: string;
  publicoAlvo?: string;
  secoes?: SecaoGerada[];
  textoEditado?: Record<string, string>;
  referencias?: ReferenciaSnapshot[];
  confidence?: number;
  confidence_method?: string;
};

export type AulaPublica = {
  id: string;
  title: string;
  slug: string;
  specialty: string;
  publicado_em: string | null;
  conteudo: AulaConteudo;
};

export async function getAulasPublicadas(): Promise<AulaPublicaResumo[]> {
  if (!serviceConfigured()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from("aula_docs").select("id,title,slug,specialty,areas").eq("status", "published").order("updated_at", { ascending: false });
    return (data as AulaPublicaResumo[]) ?? [];
  } catch {
    return [];
  }
}

export async function getAulaPublicada(slug: string): Promise<AulaPublica | null> {
  if (!serviceConfigured()) return null;
  try {
    const supabase = createPublicClient();
    const { data: doc } = await supabase
      .from("aula_docs")
      .select("id,title,slug,specialty,updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!doc) return null;

    const { data: ver } = await supabase
      .from("aula_versions")
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
      conteudo: (ver?.content as AulaConteudo) ?? {},
    };
  } catch {
    return null;
  }
}
