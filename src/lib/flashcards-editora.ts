import { createPublicClient, serviceConfigured } from "@/lib/supabase/server";
import type { SecaoGerada } from "@/lib/ai/types";

// Leitura PÚBLICA dos flashcards da Editora (flashcard_docs + flashcard_versions).
// Cliente ANÔNIMO → a RLS garante que só o publicado apareça. Migration 006.
// Modelagem: cada "secao" é a FRENTE do cartão; suas "afirmacoes" são o VERSO.

export type FlashcardPublicoResumo = { id: string; title: string; slug: string; specialty: string };

export type ReferenciaSnapshot = { id: string; titulo: string; tipo: string; autor?: string; ano?: number | null };

export type FlashcardConteudo = {
  especialidade?: string;
  secoes?: SecaoGerada[];
  textoEditado?: Record<string, string>;
  referencias?: ReferenciaSnapshot[];
  confidence?: number;
  confidence_method?: string;
};

export type FlashcardPublico = {
  id: string;
  title: string;
  slug: string;
  specialty: string;
  publicado_em: string | null;
  conteudo: FlashcardConteudo;
};

export async function getFlashcardsPublicados(): Promise<FlashcardPublicoResumo[]> {
  if (!serviceConfigured()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from("flashcard_docs").select("id,title,slug,specialty").eq("status", "published").order("updated_at", { ascending: false });
    return (data as FlashcardPublicoResumo[]) ?? [];
  } catch {
    return [];
  }
}

export async function getFlashcardPublicado(slug: string): Promise<FlashcardPublico | null> {
  if (!serviceConfigured()) return null;
  try {
    const supabase = createPublicClient();
    const { data: doc } = await supabase
      .from("flashcard_docs")
      .select("id,title,slug,specialty,updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!doc) return null;

    const { data: ver } = await supabase
      .from("flashcard_versions")
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
      conteudo: (ver?.content as FlashcardConteudo) ?? {},
    };
  } catch {
    return null;
  }
}
