"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { slugify } from "@/lib/editora";
import { getProvider } from "@/lib/ai/providers";
import { aiProviders } from "@/lib/ai/config";
import { buscarEvidencias } from "@/lib/ai/retrieval";
import { buildAtualizadorPrompt } from "@/lib/ai/prompts/atualizador-protocolos";
import { consolidarValidacao, normalizar, type Validacao } from "@/lib/ai/citations";
import { corrigirCitacoes } from "@/lib/ai/correcao";
import { buildCorrecaoAtualizadorPrompt, type ItemCorrigir } from "@/lib/ai/prompts/correcao-atualizador";
import type { Source, SecaoGerada, Issue } from "@/lib/ai/types";
import { ATUALIZACAO_SECOES } from "@/lib/editora/atualizacao-estrutura";

// Atualizador de Protocolos (híbrido/retrieval). Sobre protocol_update_docs/versions (migration
// 008). Retrieval (biblioteca interna + PubMed) → geração do delta 2 estágios; confidence pelo
// CÓDIGO (citações validadas contra as evidências recuperadas). module_type = 'atualizador-protocolos'.

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };
const msg = (e: unknown) => String(e instanceof Error ? e.message : e);

type DocResumo = { id: string; title: string; slug: string; status: string; specialty: string; protocol_id: string | null };
type ProtocoloPublicado = { id: string; title: string; specialty: string };

const ESP_DB_TO_MODULO: Record<string, string> = { ti: "UTI", emergencias: "Emergência", anestesiologia: "Anestesiologia", geral: "Outro" };

function renderSecoesTexto(secoes: SecaoGerada[] | undefined, textoEditado?: Record<string, string>): string {
  if (!secoes?.length) return "";
  return secoes.map((s) => {
    const t = textoEditado?.[s.secao] ?? s.afirmacoes.map((a) => a.texto).join(" ");
    return `## ${s.secao}\n${t}`;
  }).join("\n\n");
}

export async function listarProtocolosPublicados(): Promise<Result<ProtocoloPublicado[]>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("protocols").select("id,title,specialty").eq("status", "published").order("updated_at", { ascending: false });
    if (error) throw error;
    return { ok: true, data: (data ?? []) as ProtocoloPublicado[] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function listarDocs(): Promise<Result<DocResumo[]>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("protocol_update_docs").select("id,title,slug,status,specialty,protocol_id").order("updated_at", { ascending: false });
    if (error) throw error;
    return { ok: true, data: (data ?? []) as DocResumo[] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function criarDoc(input: { protocolId: string }): Promise<Result<DocResumo>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data: prot } = await supabase.from("protocols").select("id,title,specialty").eq("id", input.protocolId).eq("status", "published").maybeSingle();
    if (!prot) return { ok: false, error: "Selecione um protocolo publicado." };
    const title = `Atualização — ${prot.title}`;
    let slug = slugify(title), n = 1;
    for (;;) {
      const { data } = await supabase.from("protocol_update_docs").select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      n += 1; slug = `${slugify(title)}-${n}`;
    }
    const { data, error } = await supabase.from("protocol_update_docs")
      .insert({ protocol_id: prot.id, title, slug, specialty: prot.specialty, status: "draft", stage: "atualizador-protocolos" })
      .select("id,title,slug,status,specialty,protocol_id").single();
    if (error) throw error;
    revalidatePath("/admin/editora/atualizador-protocolos");
    return { ok: true, data: data as DocResumo };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// RETRIEVAL + GERAÇÃO do delta numa chamada. Busca biblioteca interna + PubMed (cache),
// monta o prompt com o protocolo atual + evidências, gera as seções do relatório e valida citações.
export async function gerar(input: {
  docId: string; incluirPubmed: boolean;
}): Promise<Result<{ secoes: SecaoGerada[]; evidencias: Source[]; validacao: Validacao; usage: { tokensIn: number; tokensOut: number }; provider: string; model: string; internos: number; pubmed: number; fromCache: boolean }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("protocol_update_docs").select("protocol_id,specialty").eq("id", input.docId).maybeSingle();
    if (!doc?.protocol_id) return { ok: false, error: "Documento sem protocolo de origem." };

    const { data: prot } = await supabase.from("protocols").select("title").eq("id", doc.protocol_id).maybeSingle();
    const { data: ver } = await supabase.from("protocol_versions")
      .select("content").eq("protocol_id", doc.protocol_id).eq("is_published", true).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const conteudo = (ver?.content ?? {}) as { secoes?: SecaoGerada[]; textoEditado?: Record<string, string> };
    const protocoloTitulo = prot?.title ?? "Protocolo";
    const protocoloTexto = renderSecoesTexto(conteudo.secoes, conteudo.textoEditado);

    const evid = await buscarEvidencias({ tema: protocoloTitulo, incluirPubmed: input.incluirPubmed });
    if (evid.sources.length === 0) return { ok: false, error: "Nenhuma evidência encontrada (biblioteca interna/PubMed) para este tema." };

    const prompt = buildAtualizadorPrompt({
      especialidade: ESP_DB_TO_MODULO[doc.specialty] ?? undefined,
      protocoloTitulo, protocoloTexto, evidencias: evid.sources, secoesAlvo: ATUALIZACAO_SECOES,
    });
    const provider = getProvider(aiProviders().generation);
    const res = await provider.generate({
      modulo: "atualizador-protocolos", especialidade: ESP_DB_TO_MODULO[doc.specialty],
      sources: evid.sources, secoesAlvo: ATUALIZACAO_SECOES, secoesAnteriores: [], prompt,
    });

    const validacao = consolidarValidacao(res.secoes, evid.sources);
    return { ok: true, data: { secoes: res.secoes, evidencias: evid.sources, validacao, usage: res.usage, provider: res.provider, model: res.model, internos: evid.internos, pubmed: evid.pubmed, fromCache: evid.fromCache } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export type RevisaoResultado = {
  issues: Issue[]; corrigido: SecaoGerada[]; usage: { tokensIn: number; tokensOut: number };
  provider: string; model: string; confidence: number; method: string;
};
export async function revisar(input: { secoes: SecaoGerada[]; evidencias: Source[] }): Promise<Result<RevisaoResultado>> {
  try {
    await requireAdmin();
    if (!input.secoes?.length) return { ok: false, error: "Gere o relatório antes de revisar." };
    const provider = getProvider(aiProviders().review);
    const rev = await provider.review({
      modulo: "atualizador-protocolos",
      draft: { provider: "", model: "", secoes: input.secoes, usage: { tokensIn: 0, tokensOut: 0 } },
      sources: input.evidencias,
    });
    const val = consolidarValidacao(input.secoes, input.evidencias);
    return { ok: true, data: { issues: rev.issues, corrigido: rev.corrigido.secoes, usage: rev.usage, provider: rev.provider, model: rev.model, confidence: val.confidence, method: val.method } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

function snapshotReferencias(secoes: SecaoGerada[], evidencias: Source[]) {
  const usados = new Set<string>();
  for (const s of secoes) for (const a of s.afirmacoes) if (a.source_id) usados.add(a.source_id);
  return evidencias
    .filter((s) => usados.has(s.id))
    .map((s) => ({ id: s.id, titulo: s.titulo, tipo: s.tipo, autor: s.autor ?? undefined, ano: s.ano ?? null, url: s.url ?? undefined }));
}

export async function salvarVersao(input: {
  docId: string;
  especialidade: string;
  tema: string;
  secoes: SecaoGerada[];
  evidencias: Source[];
  textoEditado?: Record<string, string>;
  geracao?: { provider: string; model: string; tokensIn: number; tokensOut: number; confidence: number; method: string };
  revisao?: { provider: string; model: string; tokensIn: number; tokensOut: number; issues: Issue[]; corrigido: SecaoGerada[] };
}): Promise<Result<{ versionId: string; versionNumber: number; validacao: Validacao }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();

    const validacao = consolidarValidacao(input.secoes, input.evidencias);

    const { data: ult } = await supabase.from("protocol_update_versions")
      .select("version_number").eq("doc_id", input.docId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const versionNumber = (ult?.version_number ?? 0) + 1;

    const content = {
      especialidade: input.especialidade,
      tema: input.tema,
      protocoloTitulo: input.tema,
      secoes: input.secoes,
      textoEditado: input.textoEditado ?? {},
      referencias: snapshotReferencias(input.secoes, input.evidencias),
      confidence: validacao.confidence,
      confidence_method: validacao.method,
    };

    const { data: ver, error: verErr } = await supabase.from("protocol_update_versions")
      .insert({ doc_id: input.docId, version_number: versionNumber, content, is_published: false })
      .select("id").single();
    if (verErr) throw verErr;
    const versionId = ver.id as string;

    await supabase.from("protocol_update_docs").update({ current_version_id: versionId, stage: "atualizador-protocolos" }).eq("id", input.docId);

    if (input.geracao) {
      const g = input.geracao;
      await supabase.from("ai_generations").insert({
        update_version_id: versionId,
        module_type: "atualizador-protocolos",
        provider: g.provider, model: g.model, tokens_in: g.tokensIn, tokens_out: g.tokensOut,
        output: { secoes: input.secoes },
        citations: input.secoes.flatMap((s) => s.afirmacoes),
        confidence_level: g.confidence, confidence_method: g.method,
      });
    }
    if (input.revisao) {
      const r = input.revisao;
      await supabase.from("ai_generations").insert({
        update_version_id: versionId,
        module_type: "atualizador-protocolos:review",
        provider: r.provider, model: r.model, tokens_in: r.tokensIn, tokens_out: r.tokensOut,
        output: { secoes: r.corrigido }, warnings: r.issues,
        confidence_level: validacao.confidence, confidence_method: validacao.method,
      });
    }

    revalidatePath("/admin/editora/atualizador-protocolos");
    return { ok: true, data: { versionId, versionNumber, validacao } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Carrega o CONTEÚDO de uma versão salva (secoes + textoEditado + tema + especialidade +
// evidências reconstruídas do snapshot de referências) para reabrir no editor e editar.
// Editar + salvar cria uma nova versão (append-only). Espelha o `content` do salvarVersao:
// o content guarda `referencias` (snapshot slim), não os Source[] completos — reconstruímos
// um Source[] mínimo por id p/ a lista de evidências e a validação por citação continuarem.
export async function carregarVersao(versionId: string): Promise<Result<{ especialidade: string; tema: string; secoes: SecaoGerada[]; textoEditado: Record<string, string>; evidencias: Source[] }>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("protocol_update_versions").select("content").eq("id", versionId).maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false, error: "Versão não encontrada." };
    const c = (data.content ?? {}) as {
      especialidade?: string; tema?: string; secoes?: SecaoGerada[]; textoEditado?: Record<string, string>;
      referencias?: { id: string; titulo?: string; tipo?: string; autor?: string | null; ano?: number | null; url?: string | null }[];
    };
    const evidencias: Source[] = (Array.isArray(c.referencias) ? c.referencias : []).map((r) => ({
      id: r.id, titulo: r.titulo ?? "", tipo: r.tipo ?? "", autor: r.autor ?? undefined, ano: r.ano ?? null, texto: "", url: r.url ?? undefined,
    }));
    return { ok: true, data: { especialidade: c.especialidade ?? "", tema: c.tema ?? "", secoes: Array.isArray(c.secoes) ? c.secoes : [], textoEditado: c.textoEditado ?? {}, evidencias } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// ── PUBLICAÇÃO / VERSIONAMENTO ────────────────────────────────────────────────
type VersaoResumo = { id: string; version_number: number; is_published: boolean; created_at: string };

export async function listarVersoes(docId: string): Promise<Result<VersaoResumo[]>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("protocol_update_versions")
      .select("id,version_number,is_published,created_at").eq("doc_id", docId).order("version_number", { ascending: false });
    if (error) throw error;
    return { ok: true, data: (data ?? []) as VersaoResumo[] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

function revalidarPublico(slug: string) {
  revalidatePath("/atualizacoes-protocolos");
  revalidatePath(`/atualizacoes-protocolos/${slug}`);
  revalidatePath("/admin/editora/atualizador-protocolos");
}

export async function publicarDoc(docId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("protocol_update_docs").select("slug").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Documento não encontrado." };

    const { data: alvo } = await supabase.from("protocol_update_versions")
      .select("id,is_published").eq("doc_id", docId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    if (!alvo) return { ok: false, error: "Gere e salve uma versão antes de publicar." };

    if (!alvo.is_published) {
      const { data: pubAtual } = await supabase.from("protocol_update_versions")
        .select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
      if (pubAtual && pubAtual.id !== alvo.id) {
        const { error: eUnp } = await supabase.rpc("unpublish_update_version", { p_version_id: pubAtual.id });
        if (eUnp) throw eUnp;
      }
      const { error: ePub } = await supabase.from("protocol_update_versions").update({ is_published: true }).eq("id", alvo.id);
      if (ePub) throw ePub;
    }

    const { error: eDoc } = await supabase.from("protocol_update_docs")
      .update({ status: "published", current_version_id: alvo.id }).eq("id", docId);
    if (eDoc) throw eDoc;

    revalidarPublico(doc.slug);
    return { ok: true, data: { status: "published", slug: doc.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function despublicarDoc(docId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("protocol_update_docs").select("slug").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Documento não encontrado." };
    const { data: pub } = await supabase.from("protocol_update_versions").select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
    if (pub) { const { error } = await supabase.rpc("unpublish_update_version", { p_version_id: pub.id }); if (error) throw error; }
    const { error: e2 } = await supabase.from("protocol_update_docs").update({ status: "ready_to_publish" }).eq("id", docId);
    if (e2) throw e2;
    revalidarPublico(doc.slug);
    return { ok: true, data: { status: "ready_to_publish", slug: doc.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function arquivarDoc(docId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("protocol_update_docs").select("slug").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Documento não encontrado." };
    const { data: pub } = await supabase.from("protocol_update_versions").select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
    if (pub) { const { error } = await supabase.rpc("unpublish_update_version", { p_version_id: pub.id }); if (error) throw error; }
    const { error: e2 } = await supabase.from("protocol_update_docs").update({ status: "archived" }).eq("id", docId);
    if (e2) throw e2;
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
    const { data: doc } = await supabase.from("protocol_update_docs").select("slug").eq("id", id).maybeSingle();
    const { data: pubs } = await supabase.from("protocol_update_versions").select("id").eq("doc_id", id).eq("is_published", true);
    for (const p of pubs ?? []) { const { error } = await supabase.rpc("unpublish_update_version", { p_version_id: p.id }); if (error) throw error; }
    const { error } = await supabase.from("protocol_update_docs").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/atualizacoes-protocolos"); revalidatePath("/admin/editora/atualizador-protocolos");
    if (doc?.slug) revalidatePath(`/atualizacoes-protocolos/${doc.slug}`);
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Exclui UMA versão (rascunho). A versão publicada não pode ser excluída (está no ar —
// despublique antes). Se for a versão corrente, reaponta current_version_id para a última
// restante. Remove antes as linhas de auditoria (ai_generations) daquela versão (FK).
// Tabela protocol_update_versions é chaveada por doc_id (não protocol_id).
export async function excluirVersao(input: { docId: string; versionId: string }): Promise<Result<null>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data: v } = await supabase.from("protocol_update_versions").select("id, is_published").eq("id", input.versionId).maybeSingle();
    if (!v) return { ok: false, error: "Versão não encontrada." };
    if (v.is_published) return { ok: false, error: "Esta versão está publicada (no ar). Despublique antes de excluí-la." };

    // Se for a versão corrente, reaponta para a última versão restante (ou null).
    const { data: doc } = await supabase.from("protocol_update_docs").select("current_version_id").eq("id", input.docId).maybeSingle();
    if (doc?.current_version_id === input.versionId) {
      const { data: outras } = await supabase.from("protocol_update_versions")
        .select("id").eq("doc_id", input.docId).neq("id", input.versionId)
        .order("version_number", { ascending: false }).limit(1);
      await supabase.from("protocol_update_docs").update({ current_version_id: outras?.[0]?.id ?? null }).eq("id", input.docId);
    }

    await supabase.from("ai_generations").delete().eq("update_version_id", input.versionId);
    const { error } = await supabase.from("protocol_update_versions").delete().eq("id", input.versionId);
    if (error) throw error;
    revalidatePath("/admin/editora/atualizador-protocolos");
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// "Aplicar correções da IA": pega as afirmações cuja citação foi REPROVADA (clínicas/doses
// sem âncora válida), pede à IA (DeepSeek) para reancorar/ajustar/marcar sem fonte contra as
// EVIDÊNCIAS (não o texto completo do protocolo), aplica e REVALIDA por código (âncora
// inventada não conta). Não salva — devolve as seções corrigidas pro editor; o usuário confere
// e salva. Sobe a confiança conforme as evidências realmente cobrem.
export async function aplicarCorrecoes(input: { docId: string; secoes: SecaoGerada[] }): Promise<Result<{ secoes: SecaoGerada[]; validacao: Validacao; corrigidas: number; total: number }>> {
  try {
    await requireAdmin();
    if (!input.secoes?.length) return { ok: false, error: "Gere a atualização antes de corrigir." };
    const { data: ult } = await createServiceClient().from("protocol_update_versions")
      .select("content").eq("doc_id", input.docId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const c = (ult?.content ?? {}) as { referencias?: { id: string; titulo?: string; tipo?: string; autor?: string | null; ano?: number | null; url?: string | null }[] };
    const sources: Source[] = (Array.isArray(c.referencias) ? c.referencias : []).map((r) => ({
      id: r.id, titulo: r.titulo ?? "", tipo: r.tipo ?? "", autor: r.autor ?? undefined, ano: r.ano ?? null, texto: "", url: r.url ?? undefined,
    }));
    if (sources.length === 0) return { ok: false, error: "Nenhuma evidência salva para este documento — gere e salve uma versão primeiro." };

    // Identifica as afirmações reprovadas (clinica|dose sem âncora válida), com id posicional.
    const mapa = new Map(sources.map((s) => [s.id, normalizar(s.texto)]));
    const reprovada = (a: SecaoGerada["afirmacoes"][number]) => {
      if (a.tipo !== "clinica" && a.tipo !== "dose") return false;
      if (a.conferido) return false; // já validada manualmente pelo médico — não reancorar
      const txt = a.source_id ? mapa.get(a.source_id) : undefined;
      const anc = normalizar(a.ancora ?? "");
      return !(a.source_id && txt !== undefined && anc && txt.includes(anc));
    };
    const itens: ItemCorrigir[] = [];
    input.secoes.forEach((sec, si) => (sec.afirmacoes ?? []).forEach((a, ai) => {
      if (reprovada(a)) itens.push({ id: `${si}:${ai}`, secao: sec.secao, texto: a.texto, tipo: a.tipo });
    }));

    if (itens.length === 0) {
      return { ok: true, data: { secoes: input.secoes, validacao: consolidarValidacao(input.secoes, sources), corrigidas: 0, total: 0 } };
    }

    const { correcoes } = await corrigirCitacoes({ itens, sources, prompt: buildCorrecaoAtualizadorPrompt({ itens, sources }) });

    // Aplica as correções numa cópia; o código revalida depois.
    const novo: SecaoGerada[] = input.secoes.map((sec) => ({ ...sec, afirmacoes: (sec.afirmacoes ?? []).map((a) => ({ ...a })) }));
    for (const cr of correcoes) {
      const [si, ai] = cr.id.split(":").map((n) => parseInt(n, 10));
      const alvo = novo[si]?.afirmacoes?.[ai];
      if (!alvo) continue;
      alvo.texto = cr.texto ?? alvo.texto;
      alvo.source_id = cr.source_id ?? null;
      alvo.ancora = cr.ancora ?? null;
      alvo.tipo = cr.tipo ?? alvo.tipo;
    }

    const validacao = consolidarValidacao(novo, sources); // REVALIDA por código (anti-trapaça)
    // Quantas das reprovadas agora ficaram válidas?
    const aindaReprovada = new Set<string>();
    novo.forEach((sec, si) => (sec.afirmacoes ?? []).forEach((a, ai) => { if (reprovada(a)) aindaReprovada.add(`${si}:${ai}`); }));
    const corrigidas = itens.filter((i) => !aindaReprovada.has(i.id)).length;

    return { ok: true, data: { secoes: novo, validacao, corrigidas, total: itens.length } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
