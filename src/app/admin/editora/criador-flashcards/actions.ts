"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { slugify } from "@/lib/editora";
import { getProvider } from "@/lib/ai/providers";
import { aiProviders } from "@/lib/ai/config";
import { buildCriadorFlashcardsPrompt } from "@/lib/ai/prompts/criador-flashcards";
import { consolidarValidacao, type Validacao } from "@/lib/ai/citations";
import { aplicarCorrecoesComPubMed } from "@/lib/ai/correcao-fluxo";
import { buildCorrecaoFlashcardsPrompt } from "@/lib/ai/prompts/correcao-flashcards";
import type { Source, SecaoGerada, Issue } from "@/lib/ai/types";
import { mapEspecialidadeDB } from "@/lib/editora/flashcard-estrutura";
import { sincronizarBiblioteca, removerDaBiblioteca, textoConsolidadoDeSecoes } from "@/lib/editora/biblioteca";

// Criador de Flashcards — pares frente/verso a partir de referências, com citações.
// Cada cartão é um SecaoGerada (frente = secao; verso = afirmacoes). Geração em 1 chamada
// (N cartões). Tabelas flashcard_* (migration 006). module_type = 'criador-flashcards'.

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };
const msg = (e: unknown) => String(e instanceof Error ? e.message : e);

type DocResumo = { id: string; title: string; slug: string; status: string; specialty: string };

type SourceRow = { id: string; title?: string | null; source_type?: string | null; content?: string | null; metadata?: { autor?: string | null; ano?: number | null } | null };
function rowToSource(r: SourceRow): Source {
  const meta = r.metadata ?? {};
  return { id: r.id, titulo: r.title ?? "", tipo: r.source_type ?? "", autor: meta.autor ?? undefined, ano: meta.ano ?? null, texto: r.content ?? "" };
}

export async function listarDocs(): Promise<Result<DocResumo[]>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("flashcard_docs").select("id,title,slug,status,specialty").order("updated_at", { ascending: false });
    if (error) throw error;
    return { ok: true, data: (data ?? []) as DocResumo[] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function criarDoc(input: { title: string; especialidadeModulo: string }): Promise<Result<DocResumo>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const title = (input.title || "").trim();
    if (!title) return { ok: false, error: "Informe o título do baralho." };
    let slug = slugify(title), n = 1;
    for (;;) {
      const { data } = await supabase.from("flashcard_docs").select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      n += 1; slug = `${slugify(title)}-${n}`;
    }
    const { data, error } = await supabase.from("flashcard_docs")
      .insert({ title, slug, specialty: mapEspecialidadeDB(input.especialidadeModulo), status: "draft", stage: "criador-flashcards" })
      .select("id,title,slug,status,specialty").single();
    if (error) throw error;
    revalidatePath("/admin/editora/criador-flashcards");
    return { ok: true, data: data as DocResumo };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function listarSources(docId: string): Promise<Result<Source[]>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("flashcard_sources").select("*").eq("doc_id", docId).order("created_at", { ascending: true });
    if (error) throw error;
    return { ok: true, data: (data ?? []).map(rowToSource) };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function adicionarSource(input: {
  docId: string; titulo: string; tipo: string; autor?: string; ano?: number | null; texto: string;
}): Promise<Result<Source>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    if (!(input.texto || "").trim()) return { ok: false, error: "Cole o texto da referência." };
    const { data, error } = await supabase.from("flashcard_sources").insert({
      doc_id: input.docId,
      source_type: input.tipo || "artigo",
      title: (input.titulo || "").trim() || "Referência sem título",
      content: input.texto,
      metadata: { autor: input.autor ?? null, ano: input.ano ?? null },
    }).select("*").single();
    if (error) throw error;
    return { ok: true, data: rowToSource(data) };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function removerSource(sourceId: string): Promise<Result<null>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { error } = await supabase.from("flashcard_sources").delete().eq("id", sourceId);
    if (error) throw error;
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Geração em UMA chamada: N cartões (frente/verso). Valida citações antes de devolver.
export async function gerar(input: {
  docId: string; especialidade: string; quantidade: number;
}): Promise<Result<{ secoes: SecaoGerada[]; validacao: Validacao; usage: { tokensIn: number; tokensOut: number }; provider: string; model: string }>> {
  try {
    await requireAdmin();
    const sres = await listarSources(input.docId);
    if (!sres.ok) return sres;
    const sources = sres.data;
    if (sources.length === 0) return { ok: false, error: "Adicione ao menos uma referência antes de gerar." };
    const qtd = Math.max(1, Math.min(30, input.quantidade || 10));

    const prompt = buildCriadorFlashcardsPrompt({ especialidade: input.especialidade, quantidade: qtd, sources });
    // secoesAlvo = rótulos dos cartões (usado só pelo MockProvider; os providers reais usam o prompt).
    const secoesAlvo = Array.from({ length: qtd }, (_, i) => `Cartão ${i + 1}`);
    const provider = getProvider(aiProviders().generation);
    const res = await provider.generate({
      modulo: "criador-flashcards", especialidade: input.especialidade,
      sources, secoesAlvo, secoesAnteriores: [], prompt,
    });

    const validacao = consolidarValidacao(res.secoes, sources);
    return { ok: true, data: { secoes: res.secoes, validacao, usage: res.usage, provider: res.provider, model: res.model } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export type RevisaoResultado = {
  issues: Issue[]; corrigido: SecaoGerada[]; usage: { tokensIn: number; tokensOut: number };
  provider: string; model: string; confidence: number; method: string;
};
export async function revisar(input: { docId: string; secoes: SecaoGerada[] }): Promise<Result<RevisaoResultado>> {
  try {
    await requireAdmin();
    const sres = await listarSources(input.docId);
    if (!sres.ok) return sres;
    const sources = sres.data;
    if (!input.secoes?.length) return { ok: false, error: "Gere os flashcards antes de revisar." };
    const provider = getProvider(aiProviders().review);
    const rev = await provider.review({
      modulo: "criador-flashcards",
      draft: { provider: "", model: "", secoes: input.secoes, usage: { tokensIn: 0, tokensOut: 0 } },
      sources,
    });
    const val = consolidarValidacao(input.secoes, sources);
    return { ok: true, data: { issues: rev.issues, corrigido: rev.corrigido.secoes, usage: rev.usage, provider: rev.provider, model: rev.model, confidence: val.confidence, method: val.method } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

function snapshotReferencias(secoes: SecaoGerada[], sources: Source[]) {
  const usados = new Set<string>();
  for (const s of secoes) for (const a of s.afirmacoes) if (a.source_id) usados.add(a.source_id);
  return sources
    .filter((s) => usados.has(s.id))
    .map((s) => ({ id: s.id, titulo: s.titulo, tipo: s.tipo, autor: s.autor ?? undefined, ano: s.ano ?? null }));
}

export async function salvarVersao(input: {
  docId: string;
  especialidade: string;
  secoes: SecaoGerada[];
  textoEditado?: Record<string, string>;
  geracao?: { provider: string; model: string; tokensIn: number; tokensOut: number; secoes: SecaoGerada[]; confidence: number; method: string };
  revisao?: { provider: string; model: string; tokensIn: number; tokensOut: number; issues: Issue[]; corrigido: SecaoGerada[] };
}): Promise<Result<{ versionId: string; versionNumber: number; validacao: Validacao }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();

    const sres = await listarSources(input.docId);
    if (!sres.ok) return sres;
    const sources = sres.data;

    const validacao = consolidarValidacao(input.secoes, sources);

    const { data: ult } = await supabase.from("flashcard_versions")
      .select("version_number").eq("doc_id", input.docId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const versionNumber = (ult?.version_number ?? 0) + 1;

    const content = {
      especialidade: input.especialidade,
      secoes: input.secoes,
      textoEditado: input.textoEditado ?? {},
      referencias: snapshotReferencias(input.secoes, sources),
      confidence: validacao.confidence,
      confidence_method: validacao.method,
    };

    const { data: ver, error: verErr } = await supabase.from("flashcard_versions")
      .insert({ doc_id: input.docId, version_number: versionNumber, content, is_published: false })
      .select("id").single();
    if (verErr) throw verErr;
    const versionId = ver.id as string;

    await supabase.from("flashcard_docs").update({ current_version_id: versionId, stage: "criador-flashcards" }).eq("id", input.docId);

    if (input.geracao) {
      const g = input.geracao;
      await supabase.from("ai_generations").insert({
        flashcard_version_id: versionId,
        module_type: "criador-flashcards",
        provider: g.provider,
        model: g.model,
        tokens_in: g.tokensIn,
        tokens_out: g.tokensOut,
        output: { secoes: g.secoes },
        citations: g.secoes.flatMap((s) => s.afirmacoes),
        confidence_level: g.confidence,
        confidence_method: g.method,
      });
    }

    if (input.revisao) {
      const r = input.revisao;
      await supabase.from("ai_generations").insert({
        flashcard_version_id: versionId,
        module_type: "criador-flashcards:review",
        provider: r.provider,
        model: r.model,
        tokens_in: r.tokensIn,
        tokens_out: r.tokensOut,
        output: { secoes: r.corrigido },
        warnings: r.issues,
        confidence_level: validacao.confidence,
        confidence_method: validacao.method,
      });
    }

    revalidatePath("/admin/editora/criador-flashcards");
    return { ok: true, data: { versionId, versionNumber, validacao } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Carrega o CONTEÚDO de uma versão salva (secoes + textoEditado + especialidade) para
// reabrir no editor e editar. Editar + salvar cria uma nova versão (append-only).
export async function carregarVersao(versionId: string): Promise<Result<{ especialidade: string; secoes: SecaoGerada[]; textoEditado: Record<string, string> }>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("flashcard_versions").select("content").eq("id", versionId).maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false, error: "Versão não encontrada." };
    const c = (data.content ?? {}) as { especialidade?: string; secoes?: SecaoGerada[]; textoEditado?: Record<string, string> };
    return { ok: true, data: { especialidade: c.especialidade ?? "", secoes: Array.isArray(c.secoes) ? c.secoes : [], textoEditado: c.textoEditado ?? {} } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Exclui UMA versão (rascunho). A versão publicada não pode ser excluída (está no ar —
// despublique antes). Se for a versão corrente, reaponta current_version_id para a última
// restante. Remove antes as linhas de auditoria (ai_generations) daquela versão (FK).
export async function excluirVersao(input: { docId: string; versionId: string }): Promise<Result<null>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data: v } = await supabase.from("flashcard_versions").select("id, is_published").eq("id", input.versionId).maybeSingle();
    if (!v) return { ok: false, error: "Versão não encontrada." };
    if (v.is_published) return { ok: false, error: "Esta versão está publicada (no ar). Despublique antes de excluí-la." };

    // Se for a versão corrente, reaponta para a última versão restante (ou null).
    const { data: doc } = await supabase.from("flashcard_docs").select("current_version_id").eq("id", input.docId).maybeSingle();
    if (doc?.current_version_id === input.versionId) {
      const { data: outras } = await supabase.from("flashcard_versions")
        .select("id").eq("doc_id", input.docId).neq("id", input.versionId)
        .order("version_number", { ascending: false }).limit(1);
      await supabase.from("flashcard_docs").update({ current_version_id: outras?.[0]?.id ?? null }).eq("id", input.docId);
    }

    await supabase.from("ai_generations").delete().eq("flashcard_version_id", input.versionId);
    const { error } = await supabase.from("flashcard_versions").delete().eq("id", input.versionId);
    if (error) throw error;
    revalidatePath("/admin/editora/criador-flashcards");
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// "Aplicar correções da IA": pega as afirmações do VERSO cuja citação foi REPROVADA
// (clínicas/doses sem âncora válida), pede à IA (DeepSeek) para reancorar/ajustar/marcar
// sem fonte, aplica e REVALIDA por código (âncora inventada não conta). Não salva — devolve
// os cartões corrigidos pro editor; o usuário confere e salva. Sobe a confiança conforme as
// referências realmente cobrem. Espelha aplicarCorrecoes do Arquiteto de Protocolos.
export async function aplicarCorrecoes(input: { docId: string; secoes: SecaoGerada[] }): Promise<Result<{ secoes: SecaoGerada[]; validacao: Validacao; corrigidas: number; total: number; fontesExternas: number }>> {
  try {
    await requireAdmin();
    const sres = await listarSources(input.docId);
    if (!sres.ok) return sres;
    const sources = sres.data;
    if (!input.secoes?.length) return { ok: false, error: "Gere os flashcards antes de corrigir." };

    // Identifica as afirmações reprovadas (clinica|dose sem âncora válida), com id posicional.
    const data = await aplicarCorrecoesComPubMed({
      secoes: input.secoes, sources,
      buildPrompt: (itens, srcs) => buildCorrecaoFlashcardsPrompt({ itens, sources: srcs }),
      adicionarFonte: async (hit) => {
        const r = await adicionarSource({ docId: input.docId, titulo: hit.titulo || `PubMed ${hit.pmid}`, tipo: "pubmed", autor: hit.autores || undefined, ano: hit.ano ? parseInt(hit.ano, 10) : null, texto: hit.resumo });
        return r.ok ? r.data : null;
      },
    });
    return { ok: true, data };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// ── PUBLICAÇÃO / VERSIONAMENTO ────────────────────────────────────────────────
type VersaoResumo = { id: string; version_number: number; is_published: boolean; created_at: string };

export async function listarVersoes(docId: string): Promise<Result<VersaoResumo[]>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("flashcard_versions")
      .select("id,version_number,is_published,created_at").eq("doc_id", docId).order("version_number", { ascending: false });
    if (error) throw error;
    return { ok: true, data: (data ?? []) as VersaoResumo[] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

function revalidarPublico(slug: string) {
  revalidatePath("/flashcards");
  revalidatePath(`/flashcards/${slug}`);
  revalidatePath("/admin/editora/criador-flashcards");
}

export async function publicarDoc(docId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("flashcard_docs").select("title,slug,specialty,areas").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Baralho não encontrado." };

    const { data: alvo } = await supabase.from("flashcard_versions")
      .select("id,is_published,content").eq("doc_id", docId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    if (!alvo) return { ok: false, error: "Gere e salve uma versão antes de publicar." };

    if (!alvo.is_published) {
      const { data: pubAtual } = await supabase.from("flashcard_versions")
        .select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
      if (pubAtual && pubAtual.id !== alvo.id) {
        const { error: eUnp } = await supabase.rpc("unpublish_flashcard_version", { p_version_id: pubAtual.id });
        if (eUnp) throw eUnp;
      }
      const { error: ePub } = await supabase.from("flashcard_versions").update({ is_published: true }).eq("id", alvo.id);
      if (ePub) throw ePub;
    }

    const { error: eDoc } = await supabase.from("flashcard_docs")
      .update({ status: "published", current_version_id: alvo.id }).eq("id", docId);
    if (eDoc) throw eDoc;

    const conteudo = alvo.content as { secoes?: SecaoGerada[]; textoEditado?: Record<string, string> };
    await sincronizarBiblioteca(supabase, {
      modulo: "criador-flashcards", tabelaOrigem: "flashcard_docs", docId,
      titulo: doc.title, slug: doc.slug, urlPublica: `/flashcards/${doc.slug}`,
      especialidade: doc.specialty, areas: doc.areas ?? [],
      texto: textoConsolidadoDeSecoes(conteudo.secoes ?? [], conteudo.textoEditado),
    });

    revalidarPublico(doc.slug);
    return { ok: true, data: { status: "published", slug: doc.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function despublicarDoc(docId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("flashcard_docs").select("slug").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Baralho não encontrado." };

    const { data: pub } = await supabase.from("flashcard_versions").select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
    if (pub) { const { error } = await supabase.rpc("unpublish_flashcard_version", { p_version_id: pub.id }); if (error) throw error; }

    const { error: e2 } = await supabase.from("flashcard_docs").update({ status: "ready_to_publish" }).eq("id", docId);
    if (e2) throw e2;
    await removerDaBiblioteca(supabase, "flashcard_docs", docId);
    revalidarPublico(doc.slug);
    return { ok: true, data: { status: "ready_to_publish", slug: doc.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function arquivarDoc(docId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("flashcard_docs").select("slug").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Baralho não encontrado." };

    const { data: pub } = await supabase.from("flashcard_versions").select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
    if (pub) { const { error } = await supabase.rpc("unpublish_flashcard_version", { p_version_id: pub.id }); if (error) throw error; }

    const { error: e2 } = await supabase.from("flashcard_docs").update({ status: "archived" }).eq("id", docId);
    if (e2) throw e2;
    await removerDaBiblioteca(supabase, "flashcard_docs", docId);
    revalidarPublico(doc.slug);
    return { ok: true, data: { status: "archived", slug: doc.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Exclui um documento (rascunho ou publicado). Despublica versões publicadas (imutáveis)
// antes de apagar, senão a trigger bloqueia o DELETE em cascata.
export async function excluirDoc(id: string): Promise<Result<null>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("flashcard_docs").select("slug").eq("id", id).maybeSingle();
    const { data: pubs } = await supabase.from("flashcard_versions").select("id").eq("doc_id", id).eq("is_published", true);
    for (const p of pubs ?? []) { const { error } = await supabase.rpc("unpublish_flashcard_version", { p_version_id: p.id }); if (error) throw error; }
    const { error } = await supabase.from("flashcard_docs").delete().eq("id", id);
    if (error) throw error;
    await removerDaBiblioteca(supabase, "flashcard_docs", id);
    revalidatePath("/flashcards"); revalidatePath("/admin/editora/criador-flashcards");
    if (doc?.slug) revalidatePath(`/flashcards/${doc.slug}`);
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
