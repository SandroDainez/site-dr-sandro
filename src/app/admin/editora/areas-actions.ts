"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";

// Multi-especialidade dos documentos da Editora (coluna `areas text[]`, migration 010).
// Seleção múltipla PLANA: o documento aparece nos hubs /especialidade/[area] de cada área
// marcada. Ação genérica compartilhada por todos os módulos (uma allowlist de tabelas).

// Áreas do site (mesmos códigos usados em /especialidade/[area] e nos hubs).
export const AREAS_SITE = [
  { id: "anestesiologia", label: "Anestesiologia" },
  { id: "ti", label: "Terapia Intensiva" },
  { id: "emergencias", label: "Emergências" },
] as const;
export type AreaSite = (typeof AREAS_SITE)[number]["id"];
const AREA_IDS = AREAS_SITE.map((a) => a.id) as readonly string[];

// Tabelas doc da Editora que têm a coluna `areas` (allowlist — nunca aceitar tabela livre).
export const TABELAS_EDITORA = [
  "protocols", "sci_docs", "aula_docs", "flashcard_docs", "questao_docs", "research_docs", "protocol_update_docs",
] as const;
export type TabelaEditora = (typeof TABELAS_EDITORA)[number];

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };
const msg = (e: unknown) => String(e instanceof Error ? e.message : e);

function validarTabela(t: string): t is TabelaEditora {
  return (TABELAS_EDITORA as readonly string[]).includes(t);
}

export async function getAreasEditora(tabela: string, docId: string): Promise<Result<string[]>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    if (!validarTabela(tabela)) return { ok: false, error: "Tabela inválida." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from(tabela).select("areas").eq("id", docId).maybeSingle();
    if (error) throw error;
    return { ok: true, data: (data?.areas as string[] | null) ?? [] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function definirAreasEditora(tabela: string, docId: string, areas: string[]): Promise<Result<string[]>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    if (!validarTabela(tabela)) return { ok: false, error: "Tabela inválida." };
    // Só aceita áreas conhecidas; remove duplicatas e ordena por AREAS_SITE.
    const limpo = AREA_IDS.filter((id) => areas.includes(id));
    const supabase = createServiceClient();
    const { error } = await supabase.from(tabela).update({ areas: limpo }).eq("id", docId);
    if (error) throw error;
    // Os hubs são dinâmicos (force-dynamic), mas revalidamos para refletir na hora.
    for (const id of AREA_IDS) revalidatePath(`/especialidade/${id}`);
    return { ok: true, data: limpo };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
