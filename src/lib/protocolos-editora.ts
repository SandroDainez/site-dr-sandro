import { createPublicClient, serviceConfigured } from "@/lib/supabase/server";
import type { SecaoGerada } from "@/lib/ai/types";

// Leitura PÚBLICA dos protocolos da Editora (tabela protocols + protocol_versions).
// Usa o cliente ANÔNIMO de propósito → a RLS garante que só o publicado apareça
// (protocols.status='published' + protocol_versions.is_published=true). Ver migration 003.

export type ProtocoloPublicoResumo = { id: string; title: string; slug: string; specialty: string };

export type ProtocoloConteudo = {
  especialidade?: string;
  secoes?: SecaoGerada[];
  textoEditado?: Record<string, string>;
  confidence?: number;
  confidence_method?: string;
};

export type ProtocoloPublico = {
  id: string;
  title: string;
  slug: string;
  specialty: string;
  publicado_em: string | null;
  conteudo: ProtocoloConteudo;
};

export async function getProtocolosPublicados(): Promise<ProtocoloPublicoResumo[]> {
  if (!serviceConfigured()) return [];
  try {
    const supabase = createPublicClient(); // anon → RLS só devolve status='published'
    const { data } = await supabase.from("protocols").select("id,title,slug,specialty").eq("status", "published").order("updated_at", { ascending: false });
    return (data as ProtocoloPublicoResumo[]) ?? [];
  } catch {
    return [];
  }
}

export async function getProtocoloPublicado(slug: string): Promise<ProtocoloPublico | null> {
  if (!serviceConfigured()) return null;
  try {
    const supabase = createPublicClient(); // anon → RLS
    const { data: prot } = await supabase
      .from("protocols")
      .select("id,title,slug,specialty,updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!prot) return null;

    // versão publicada (RLS: is_published=true). Deve haver no máximo uma.
    const { data: ver } = await supabase
      .from("protocol_versions")
      .select("content,created_at")
      .eq("protocol_id", prot.id)
      .eq("is_published", true)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      id: prot.id,
      title: prot.title,
      slug: prot.slug,
      specialty: prot.specialty,
      publicado_em: ver?.created_at ?? null,
      conteudo: (ver?.content as ProtocoloConteudo) ?? {},
    };
  } catch {
    return null;
  }
}
