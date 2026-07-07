"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { searchInternalLibrary } from "@/lib/assistente/search-library";

// Ações compartilhadas da ingestão de FONTES dos módulos de geração (Arquiteto, Editor
// Científico/Premium, Aulas, Flashcards, Questões). A extração de PDF reusa extrairTextoPdf
// (admin/referencias) — importada direto no componente. Aqui fica a BUSCA na biblioteca interna.

export type BibliotecaHit = { conteudo: string; titulo: string; tipo: string; url: string | null; score: number };
type Result = { ok: true; data: BibliotecaHit[] } | { ok: false; error: string };

// Busca trechos no acervo interno (kb_chunks via hybrid_search) — os mesmos usados pelos
// módulos de retrieval. O usuário escolhe quais trechos viram fonte.
export async function buscarNaBiblioteca(query: string): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const q = (query || "").trim();
    if (q.length < 3) return { ok: false, error: "Digite ao menos 3 caracteres para buscar." };
    const supabase = createServiceClient();
    const hits = await searchInternalLibrary(supabase, q, 10);
    const data = hits
      .filter((h) => h.conteudo.trim())
      .map((h) => ({
        conteudo: h.conteudo,
        titulo: h.fonte_titulo || "Biblioteca interna",
        tipo: h.fonte_tipo || "biblioteca",
        url: h.fonte_url,
        score: h.score,
      }));
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}
