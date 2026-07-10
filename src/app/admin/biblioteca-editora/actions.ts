"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { salvarReferencia } from "@/app/admin/referencias/actions";

type Result<T = unknown> = { ok: boolean; data?: T; error?: string };

function msg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    return String(o.message || o.details || o.hint || JSON.stringify(e));
  }
  return String(e);
}

export type ItemBiblioteca = {
  id: string;
  modulo: string;
  tabela_origem: string;
  doc_id: string;
  titulo: string;
  slug: string;
  url_publica: string;
  especialidade: string;
  areas: string[];
  texto: string;
  publicado_em: string;
  atualizado_em: string;
};

// Lista tudo já publicado pela Editora (qualquer módulo). Busca textual simples
// (título + corpo) via ILIKE — catálogo é pequeno, não precisa de embeddings.
export async function listarBibliotecaEditora(filtros?: { q?: string; modulo?: string }): Promise<Result<ItemBiblioteca[]>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    let query = supabase.from("biblioteca_editora")
      .select("id,modulo,tabela_origem,doc_id,titulo,slug,url_publica,especialidade,areas,texto,publicado_em,atualizado_em")
      .order("atualizado_em", { ascending: false })
      .limit(300);
    if (filtros?.modulo) query = query.eq("modulo", filtros.modulo);
    if (filtros?.q?.trim()) query = query.or(`titulo.ilike.%${filtros.q.trim()}%,texto.ilike.%${filtros.q.trim()}%`);
    const { data, error } = await query;
    if (error) throw error;
    return { ok: true, data: (data ?? []) as ItemBiblioteca[] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Manda um item da Biblioteca da Editora pro Banco de Referências 1 (kb_referencias) —
// passa a valer também pro assistente de IA do site e pro modo "Buscar na biblioteca"
// que já existe em todos os módulos (via reindexação normal).
export async function enviarParaReferencias(id: string): Promise<Result<null>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data: item } = await supabase.from("biblioteca_editora")
      .select("titulo,url_publica,especialidade,texto").eq("id", id).maybeSingle();
    if (!item) return { ok: false, error: "Item não encontrado." };
    const r = await salvarReferencia({
      titulo: item.titulo,
      tipo: "Editora médica",
      fonte_url: item.url_publica,
      area: item.especialidade,
      conteudo: item.texto,
      ativo: true,
    });
    if (!r.ok) return { ok: false, error: r.error };
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
