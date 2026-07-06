import { createPublicClient, createServiceClient, serviceConfigured } from "@/lib/supabase/server";

// Editora Médica — artigos/matérias. Dados relacionais no Supabase (tabela
// editora_artigos, migration 002). Leitura pública = só status 'publicado' (RLS);
// leitura/escrita de admin = service-role (bypassa RLS). Ver docs/PLANO-EDITORA.md.

export type ArtigoEspecialidade = "emergencias" | "ti" | "anestesiologia" | "geral";
export type ArtigoStatus = "rascunho" | "publicado";

export type Artigo = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  corpo: string; // HTML (texto rico)
  autor: string;
  especialidade: ArtigoEspecialidade;
  capa_url: string;
  status: ArtigoStatus;
  publicado_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

export const ARTIGO_ESPECIALIDADES: { value: ArtigoEspecialidade; label: string }[] = [
  { value: "geral", label: "Geral" },
  { value: "emergencias", label: "Emergências" },
  { value: "ti", label: "Terapia Intensiva" },
  { value: "anestesiologia", label: "Anestesiologia" },
];

export function slugify(s: string): string {
  return (
    (s || "")
      .normalize("NFD")
      .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // remove acentos (diacríticos)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "artigo"
  );
}

// ── Leitura pública (só publicados) ──────────────────────────────────────────
export async function getArtigosPublicados(): Promise<Artigo[]> {
  if (!serviceConfigured()) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("editora_artigos")
      .select("*")
      .eq("status", "publicado")
      .order("publicado_em", { ascending: false });
    return (data as Artigo[]) ?? [];
  } catch {
    return [];
  }
}

export async function getArtigoBySlug(slug: string): Promise<Artigo | null> {
  if (!serviceConfigured()) return null;
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("editora_artigos")
      .select("*")
      .eq("slug", slug)
      .eq("status", "publicado")
      .maybeSingle();
    return (data as Artigo) ?? null;
  } catch {
    return null;
  }
}

// ── Leitura de admin (todos os status) ───────────────────────────────────────
export async function getArtigosAdmin(): Promise<Artigo[]> {
  if (!serviceConfigured()) return [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("editora_artigos")
      .select("*")
      .order("atualizado_em", { ascending: false });
    return (data as Artigo[]) ?? [];
  } catch {
    return [];
  }
}
