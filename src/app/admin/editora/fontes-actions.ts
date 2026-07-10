"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { searchInternalLibrary } from "@/lib/assistente/search-library";
import { buscarEvidencias } from "@/lib/ai/retrieval";

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

// Busca no que a PRÓPRIA Editora já publicou (biblioteca_editora — "banco 2", ver
// src/lib/editora/biblioteca.ts). Distinta de buscarNaBiblioteca (kb_chunks, acervo manual).
export type EditoraHit = { conteudo: string; titulo: string; tipo: string; url: string | null };
type EditoraResult = { ok: true; data: EditoraHit[] } | { ok: false; error: string };
export async function buscarNaBibliotecaEditora(query: string): Promise<EditoraResult> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const q = (query || "").trim();
    if (q.length < 3) return { ok: false, error: "Digite ao menos 3 caracteres para buscar." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("biblioteca_editora")
      .select("titulo,texto,modulo,url_publica")
      .or(`titulo.ilike.%${q}%,texto.ilike.%${q}%`)
      .order("atualizado_em", { ascending: false })
      .limit(15);
    if (error) throw error;
    return { ok: true, data: (data ?? []).map((r) => ({ conteudo: r.texto, titulo: r.titulo, tipo: r.modulo, url: r.url_publica })) };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

// Busca por IA: biblioteca interna + PubMed (via a camada de retrieval, com cache). Cada
// resultado (trecho interno ou abstract de artigo REAL, com PMID) pode virar fonte.
export type IaHit = { conteudo: string; titulo: string; tipo: string; url: string | null; autor?: string; ano?: number | null };
type IaResult = { ok: true; data: IaHit[]; internos: number; pubmed: number } | { ok: false; error: string };
export async function buscarPorIA(tema: string): Promise<IaResult> {
  try {
    await requireAdmin();
    const q = (tema || "").trim();
    if (q.length < 4) return { ok: false, error: "Descreva o tema (mín. 4 caracteres)." };
    const evid = await buscarEvidencias({ tema: q, incluirPubmed: true });
    const data: IaHit[] = evid.sources.map((s) => ({
      conteudo: s.texto, titulo: s.titulo, tipo: s.tipo, url: s.url ?? null, autor: s.autor, ano: s.ano ?? null,
    }));
    return { ok: true, data, internos: evid.internos, pubmed: evid.pubmed };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}
