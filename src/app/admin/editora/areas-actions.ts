"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { AREA_IDS, validarTabelaEditora } from "@/lib/editora/areas";

// Multi-especialidade dos documentos da Editora (coluna `areas text[]`, migration 010).
// Seleção múltipla PLANA: o documento aparece nos hubs /especialidade/[area] de cada área
// marcada. Ação genérica compartilhada por todos os módulos (allowlist de tabelas).
//
// ATENÇÃO: este arquivo é "use server" — só pode exportar FUNÇÕES ASYNC. As constantes/tipos
// (AREAS_SITE, TABELAS_EDITORA) ficam em @/lib/editora/areas (módulo comum), senão viram
// referência de server-action no client e quebram a renderização.

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };
const msg = (e: unknown) => String(e instanceof Error ? e.message : e);

export async function getAreasEditora(tabela: string, docId: string): Promise<Result<string[]>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    if (!validarTabelaEditora(tabela)) return { ok: false, error: "Tabela inválida." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from(tabela).select("areas").eq("id", docId).maybeSingle();
    if (error) throw error;
    return { ok: true, data: (data?.areas as string[] | null) ?? [] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Especialidade PRINCIPAL (coluna `specialty`, única) — diferente de `areas` (múltiplas,
// "também aparece em"). Mudar a principal não mexe nas extras.
export async function definirEspecialidadePrincipal(tabela: string, docId: string, especialidade: string): Promise<Result<null>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    if (!validarTabelaEditora(tabela)) return { ok: false, error: "Tabela inválida." };
    if (!AREA_IDS.includes(especialidade)) return { ok: false, error: "Especialidade inválida." };
    const supabase = createServiceClient();
    const { error } = await supabase.from(tabela).update({ specialty: especialidade }).eq("id", docId);
    if (error) throw error;
    for (const id of AREA_IDS) revalidatePath(`/especialidade/${id}`);
    revalidatePath("/protocolos"); revalidatePath("/aulas"); revalidatePath("/flashcards");
    revalidatePath("/questoes"); revalidatePath("/pesquisas"); revalidatePath("/comparativos");
    revalidatePath("/atualizacoes-protocolos"); revalidatePath("/biblioteca-cientifica");
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function definirAreasEditora(tabela: string, docId: string, areas: string[]): Promise<Result<string[]>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    if (!validarTabelaEditora(tabela)) return { ok: false, error: "Tabela inválida." };
    // Só aceita áreas conhecidas; remove duplicatas e ordena por AREA_IDS.
    const limpo = AREA_IDS.filter((id) => areas.includes(id));
    const supabase = createServiceClient();
    const { error } = await supabase.from(tabela).update({ areas: limpo }).eq("id", docId);
    if (error) throw error;
    // Os hubs são dinâmicos (force-dynamic), mas revalidamos para refletir na hora.
    for (const id of AREA_IDS) revalidatePath(`/especialidade/${id}`);
    return { ok: true, data: limpo };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
