import { createPublicClient, serviceConfigured } from "@/lib/supabase/server";
import type { SecaoGerada } from "@/lib/ai/types";

// Leitura PÚBLICA dos relatórios de atualização de protocolo (protocol_update_docs/versions).
// Cliente ANÔNIMO → RLS só devolve o publicado. Migration 008.

export type AtualizacaoResumo = { id: string; title: string; slug: string; specialty: string };

export type ReferenciaSnapshot = { id: string; titulo: string; tipo: string; autor?: string; ano?: number | null; url?: string };

export type AtualizacaoConteudo = {
  especialidade?: string;
  tema?: string;
  protocoloTitulo?: string;
  secoes?: SecaoGerada[];
  textoEditado?: Record<string, string>;
  referencias?: ReferenciaSnapshot[];
  confidence?: number;
  confidence_method?: string;
};

export type AtualizacaoPublica = {
  id: string;
  title: string;
  slug: string;
  specialty: string;
  publicado_em: string | null;
  conteudo: AtualizacaoConteudo;
};

export async function getAtualizacoesPublicadas(): Promise<AtualizacaoResumo[]> {
  if (!serviceConfigured()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from("protocol_update_docs").select("id,title,slug,specialty").eq("status", "published").order("updated_at", { ascending: false });
    return (data as AtualizacaoResumo[]) ?? [];
  } catch {
    return [];
  }
}

export async function getAtualizacaoPublicada(slug: string): Promise<AtualizacaoPublica | null> {
  if (!serviceConfigured()) return null;
  try {
    const supabase = createPublicClient();
    const { data: doc } = await supabase
      .from("protocol_update_docs")
      .select("id,title,slug,specialty,updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!doc) return null;

    const { data: ver } = await supabase
      .from("protocol_update_versions")
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
      conteudo: (ver?.content as AtualizacaoConteudo) ?? {},
    };
  } catch {
    return null;
  }
}
