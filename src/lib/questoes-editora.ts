import { createPublicClient, serviceConfigured } from "@/lib/supabase/server";
import type { QuestaoGerada } from "@/lib/editora/questao-estrutura";

// Leitura PÚBLICA dos conjuntos de questões da Editora (questao_docs + questao_versions).
// Cliente ANÔNIMO → RLS só devolve o publicado. Migration 007.

export type QuestaoDocResumo = { id: string; title: string; slug: string; specialty: string; areas: string[] };

export type ReferenciaSnapshot = { id: string; titulo: string; tipo: string; autor?: string; ano?: number | null };

export type QuestaoDocConteudo = {
  especialidade?: string;
  nivel?: string;
  questoes?: QuestaoGerada[];
  referencias?: ReferenciaSnapshot[];
  confidence?: number;
  confidence_method?: string;
};

export type QuestaoDocPublico = {
  id: string;
  title: string;
  slug: string;
  specialty: string;
  publicado_em: string | null;
  conteudo: QuestaoDocConteudo;
};

export async function getQuestaoDocsPublicados(): Promise<QuestaoDocResumo[]> {
  if (!serviceConfigured()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from("questao_docs").select("id,title,slug,specialty,areas").eq("status", "published").order("updated_at", { ascending: false });
    return (data as QuestaoDocResumo[]) ?? [];
  } catch {
    return [];
  }
}

export async function getQuestaoDocPublicado(slug: string): Promise<QuestaoDocPublico | null> {
  if (!serviceConfigured()) return null;
  try {
    const supabase = createPublicClient();
    const { data: doc } = await supabase
      .from("questao_docs")
      .select("id,title,slug,specialty,updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!doc) return null;

    const { data: ver } = await supabase
      .from("questao_versions")
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
      conteudo: (ver?.content as QuestaoDocConteudo) ?? {},
    };
  } catch {
    return null;
  }
}
