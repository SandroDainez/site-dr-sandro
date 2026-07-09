"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { validarTabelaEditora } from "@/lib/editora/areas";

// Imagem/infográfico + tamanho (px) de qualquer documento da Editora — GENÉRICO (allowlist
// de tabelas, mesmo padrão de areas-actions.ts). Aparece no card padrão do conteúdo publicado.

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };
const msg = (e: unknown) => String(e instanceof Error ? e.message : e);

export async function getImagemEditora(tabela: string, docId: string): Promise<Result<{ url: string | null; size: number | null }>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    if (!validarTabelaEditora(tabela)) return { ok: false, error: "Tabela inválida." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from(tabela).select("image_url,image_size").eq("id", docId).maybeSingle();
    if (error) throw error;
    return { ok: true, data: { url: (data?.image_url as string | null) ?? null, size: (data?.image_size as number | null) ?? null } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function definirImagemEditora(tabela: string, docId: string, url: string | null, size?: number | null): Promise<Result<null>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    if (!validarTabelaEditora(tabela)) return { ok: false, error: "Tabela inválida." };
    const supabase = createServiceClient();
    const patch: Record<string, unknown> = { image_url: url };
    if (size !== undefined) patch.image_size = size;
    const { error } = await supabase.from(tabela).update(patch).eq("id", docId);
    if (error) throw error;
    revalidatePath("/protocolos"); revalidatePath("/aulas"); revalidatePath("/flashcards");
    revalidatePath("/questoes"); revalidatePath("/pesquisas"); revalidatePath("/comparativos");
    revalidatePath("/atualizacoes-protocolos"); revalidatePath("/biblioteca-cientifica");
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
