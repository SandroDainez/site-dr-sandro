"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { slugify } from "@/lib/editora";
import { consolidarValidacao, normalizar, type Validacao } from "@/lib/ai/citations";
import { corrigirCitacoes } from "@/lib/ai/correcao";
import { buildCorrecaoQuestoesPrompt, type ItemCorrigir } from "@/lib/ai/prompts/correcao-questoes";
import type { Source, Issue, Afirmacao } from "@/lib/ai/types";
import { gerarQuestoesIA, revisarQuestoesIA } from "@/lib/ai/questoes-gen";
import { mapEspecialidadeDB, questoesToSecoes, justificativaTexto, type QuestaoGerada } from "@/lib/editora/questao-estrutura";
import { sincronizarBiblioteca, removerDaBiblioteca, textoConsolidadoDeQuestoes } from "@/lib/editora/biblioteca";

// Criador de Questões (MCQ) — casa própria com pipeline completo (sources, citações,
// confidence, versionamento imutável) sobre questao_docs/versions/sources (migration 007).
// Ao PUBLICAR, sincroniza (soft: ativo) com a tabela `questoes` do quiz via editora_doc_id.

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
    const { data, error } = await supabase.from("questao_docs").select("id,title,slug,status,specialty").order("updated_at", { ascending: false });
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
    if (!title) return { ok: false, error: "Informe o título do conjunto." };
    let slug = slugify(title), n = 1;
    for (;;) {
      const { data } = await supabase.from("questao_docs").select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      n += 1; slug = `${slugify(title)}-${n}`;
    }
    const { data, error } = await supabase.from("questao_docs")
      .insert({ title, slug, specialty: mapEspecialidadeDB(input.especialidadeModulo), status: "draft", stage: "criador-questoes" })
      .select("id,title,slug,status,specialty").single();
    if (error) throw error;
    revalidatePath("/admin/editora/criador-questoes");
    return { ok: true, data: data as DocResumo };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function listarSources(docId: string): Promise<Result<Source[]>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("questao_sources").select("*").eq("doc_id", docId).order("created_at", { ascending: true });
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
    const { data, error } = await supabase.from("questao_sources").insert({
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
    const { error } = await supabase.from("questao_sources").delete().eq("id", sourceId);
    if (error) throw error;
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Geração em UMA chamada: N questões MCQ. Valida citações da justificativa (via secoes derivadas).
export async function gerar(input: {
  docId: string; especialidade: string; nivel: string; quantidade: number;
}): Promise<Result<{ questoes: QuestaoGerada[]; validacao: Validacao; usage: { tokensIn: number; tokensOut: number }; provider: string; model: string }>> {
  try {
    await requireAdmin();
    const sres = await listarSources(input.docId);
    if (!sres.ok) return sres;
    const sources = sres.data;
    if (sources.length === 0) return { ok: false, error: "Adicione ao menos uma referência antes de gerar." };
    const qtd = Math.max(1, Math.min(20, input.quantidade || 5));

    const res = await gerarQuestoesIA({ especialidade: input.especialidade, nivel: input.nivel, quantidade: qtd, sources });
    const validacao = consolidarValidacao(questoesToSecoes(res.questoes), sources);
    return { ok: true, data: { questoes: res.questoes, validacao, usage: res.usage, provider: res.provider, model: res.model } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export type RevisaoResultado = {
  issues: Issue[]; corrigido: QuestaoGerada[]; usage: { tokensIn: number; tokensOut: number };
  provider: string; model: string; confidence: number; method: string;
};
export async function revisar(input: { docId: string; questoes: QuestaoGerada[] }): Promise<Result<RevisaoResultado>> {
  try {
    await requireAdmin();
    const sres = await listarSources(input.docId);
    if (!sres.ok) return sres;
    const sources = sres.data;
    if (!input.questoes?.length) return { ok: false, error: "Gere as questões antes de revisar." };
    const rev = await revisarQuestoesIA({ questoes: input.questoes, sources });
    const val = consolidarValidacao(questoesToSecoes(input.questoes), sources);
    return { ok: true, data: { issues: rev.issues, corrigido: rev.corrigido, usage: rev.usage, provider: rev.provider, model: rev.model, confidence: val.confidence, method: val.method } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

function snapshotReferencias(questoes: QuestaoGerada[], sources: Source[]) {
  const usados = new Set<string>();
  for (const q of questoes) for (const a of q.justificativa ?? []) if (a.source_id) usados.add(a.source_id);
  return sources
    .filter((s) => usados.has(s.id))
    .map((s) => ({ id: s.id, titulo: s.titulo, tipo: s.tipo, autor: s.autor ?? undefined, ano: s.ano ?? null }));
}

export async function salvarVersao(input: {
  docId: string;
  especialidade: string;
  nivel: string;
  questoes: QuestaoGerada[];
  geracao?: { provider: string; model: string; tokensIn: number; tokensOut: number; confidence: number; method: string };
  revisao?: { provider: string; model: string; tokensIn: number; tokensOut: number; issues: Issue[]; corrigido: QuestaoGerada[] };
}): Promise<Result<{ versionId: string; versionNumber: number; validacao: Validacao }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();

    const sres = await listarSources(input.docId);
    if (!sres.ok) return sres;
    const sources = sres.data;

    const validacao = consolidarValidacao(questoesToSecoes(input.questoes), sources);

    const { data: ult } = await supabase.from("questao_versions")
      .select("version_number").eq("doc_id", input.docId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const versionNumber = (ult?.version_number ?? 0) + 1;

    const content = {
      especialidade: input.especialidade,
      nivel: input.nivel,
      questoes: input.questoes,
      referencias: snapshotReferencias(input.questoes, sources),
      confidence: validacao.confidence,
      confidence_method: validacao.method,
    };

    const { data: ver, error: verErr } = await supabase.from("questao_versions")
      .insert({ doc_id: input.docId, version_number: versionNumber, content, is_published: false })
      .select("id").single();
    if (verErr) throw verErr;
    const versionId = ver.id as string;

    await supabase.from("questao_docs").update({ current_version_id: versionId, stage: "criador-questoes" }).eq("id", input.docId);

    if (input.geracao) {
      const g = input.geracao;
      await supabase.from("ai_generations").insert({
        questao_version_id: versionId,
        module_type: "criador-questoes",
        provider: g.provider,
        model: g.model,
        tokens_in: g.tokensIn,
        tokens_out: g.tokensOut,
        output: { questoes: input.questoes },
        citations: input.questoes.flatMap((q) => q.justificativa ?? []),
        confidence_level: g.confidence,
        confidence_method: g.method,
      });
    }

    if (input.revisao) {
      const r = input.revisao;
      await supabase.from("ai_generations").insert({
        questao_version_id: versionId,
        module_type: "criador-questoes:review",
        provider: r.provider,
        model: r.model,
        tokens_in: r.tokensIn,
        tokens_out: r.tokensOut,
        output: { questoes: r.corrigido },
        warnings: r.issues,
        confidence_level: validacao.confidence,
        confidence_method: validacao.method,
      });
    }

    revalidatePath("/admin/editora/criador-questoes");
    return { ok: true, data: { versionId, versionNumber, validacao } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// ── PUBLICAÇÃO / VERSIONAMENTO + SINCRONIZAÇÃO COM O QUIZ (tabela questoes) ────
type VersaoResumo = { id: string; version_number: number; is_published: boolean; created_at: string };

export async function listarVersoes(docId: string): Promise<Result<VersaoResumo[]>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("questao_versions")
      .select("id,version_number,is_published,created_at").eq("doc_id", docId).order("version_number", { ascending: false });
    if (error) throw error;
    return { ok: true, data: (data ?? []) as VersaoResumo[] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

function revalidarPublico(slug: string) {
  revalidatePath("/questoes");
  revalidatePath(`/questoes/${slug}`);
  revalidatePath("/admin/editora/criador-questoes");
  revalidatePath("/estudar");
}

type ServiceClient = ReturnType<typeof createServiceClient>;

// Desativa (soft) todas as linhas de questoes geradas por este doc. NUNCA deleta
// (srs_cards.questao_id é ON DELETE CASCADE → apagaria o progresso do usuário).
async function desativarNoQuiz(supabase: ServiceClient, docId: string) {
  await supabase.from("questoes").update({ ativo: false }).eq("editora_doc_id", docId);
}

// Insere as questões da versão publicada na tabela do quiz (ativo=true), após desativar as antigas.
async function sincronizarNoQuiz(supabase: ServiceClient, docId: string) {
  const { data: doc } = await supabase.from("questao_docs").select("title,specialty").eq("id", docId).maybeSingle();
  const { data: ver } = await supabase.from("questao_versions")
    .select("content").eq("doc_id", docId).eq("is_published", true).order("version_number", { ascending: false }).limit(1).maybeSingle();
  const content = (ver?.content ?? {}) as { nivel?: string; questoes?: QuestaoGerada[] };
  const questoes = content.questoes ?? [];

  await desativarNoQuiz(supabase, docId);
  if (questoes.length === 0) return;

  const rows = questoes
    .filter((q) => q.enunciado && q.opcoes.length >= 2)
    .map((q) => ({
      enunciado: q.enunciado,
      opcoes: q.opcoes,
      correta: q.correta,
      explicacao: justificativaTexto(q),
      area: doc?.specialty ?? "geral",
      tema: doc?.title ?? null,
      nivel: content.nivel ?? "Médio",
      ativo: true,
      editora_doc_id: docId,
    }));
  if (rows.length) await supabase.from("questoes").insert(rows);
}

export async function publicarDoc(docId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("questao_docs").select("title,slug,specialty,areas").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Conjunto não encontrado." };

    const { data: alvo } = await supabase.from("questao_versions")
      .select("id,is_published,content").eq("doc_id", docId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    if (!alvo) return { ok: false, error: "Gere e salve uma versão antes de publicar." };

    if (!alvo.is_published) {
      const { data: pubAtual } = await supabase.from("questao_versions")
        .select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
      if (pubAtual && pubAtual.id !== alvo.id) {
        const { error: eUnp } = await supabase.rpc("unpublish_questao_version", { p_version_id: pubAtual.id });
        if (eUnp) throw eUnp;
      }
      const { error: ePub } = await supabase.from("questao_versions").update({ is_published: true }).eq("id", alvo.id);
      if (ePub) throw ePub;
    }

    const { error: eDoc } = await supabase.from("questao_docs")
      .update({ status: "published", current_version_id: alvo.id }).eq("id", docId);
    if (eDoc) throw eDoc;

    await sincronizarNoQuiz(supabase, docId); // alimenta o quiz (soft)

    const conteudo = alvo.content as { questoes?: QuestaoGerada[] };
    await sincronizarBiblioteca(supabase, {
      modulo: "criador-questoes", tabelaOrigem: "questao_docs", docId,
      titulo: doc.title, slug: doc.slug, urlPublica: `/questoes/${doc.slug}`,
      especialidade: doc.specialty, areas: doc.areas ?? [],
      texto: textoConsolidadoDeQuestoes(conteudo.questoes ?? []),
    });

    revalidarPublico(doc.slug);
    return { ok: true, data: { status: "published", slug: doc.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function despublicarDoc(docId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("questao_docs").select("slug").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Conjunto não encontrado." };

    const { data: pub } = await supabase.from("questao_versions").select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
    if (pub) { const { error } = await supabase.rpc("unpublish_questao_version", { p_version_id: pub.id }); if (error) throw error; }

    await desativarNoQuiz(supabase, docId); // remove do quiz (soft)

    const { error: e2 } = await supabase.from("questao_docs").update({ status: "ready_to_publish" }).eq("id", docId);
    if (e2) throw e2;
    await removerDaBiblioteca(supabase, "questao_docs", docId);
    revalidarPublico(doc.slug);
    return { ok: true, data: { status: "ready_to_publish", slug: doc.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function arquivarDoc(docId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("questao_docs").select("slug").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Conjunto não encontrado." };

    const { data: pub } = await supabase.from("questao_versions").select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
    if (pub) { const { error } = await supabase.rpc("unpublish_questao_version", { p_version_id: pub.id }); if (error) throw error; }

    await desativarNoQuiz(supabase, docId);

    const { error: e2 } = await supabase.from("questao_docs").update({ status: "archived" }).eq("id", docId);
    if (e2) throw e2;
    await removerDaBiblioteca(supabase, "questao_docs", docId);
    revalidarPublico(doc.slug);
    return { ok: true, data: { status: "archived", slug: doc.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Carrega o CONTEÚDO de uma versão salva (questoes + especialidade + nivel) para reabrir
// no editor de questões e editar. Editar + salvar cria uma nova versão (append-only).
export async function carregarVersao(versionId: string): Promise<Result<{ especialidade: string; nivel: string; questoes: QuestaoGerada[] }>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("questao_versions").select("content").eq("id", versionId).maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false, error: "Versão não encontrada." };
    const c = (data.content ?? {}) as { especialidade?: string; nivel?: string; questoes?: QuestaoGerada[] };
    return { ok: true, data: { especialidade: c.especialidade ?? "", nivel: c.nivel ?? "", questoes: Array.isArray(c.questoes) ? c.questoes : [] } };
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
    const { data: v } = await supabase.from("questao_versions").select("id, is_published").eq("id", input.versionId).maybeSingle();
    if (!v) return { ok: false, error: "Versão não encontrada." };
    if (v.is_published) return { ok: false, error: "Esta versão está publicada (no ar). Despublique antes de excluí-la." };

    // Se for a versão corrente, reaponta para a última versão restante (ou null).
    const { data: doc } = await supabase.from("questao_docs").select("current_version_id").eq("id", input.docId).maybeSingle();
    if (doc?.current_version_id === input.versionId) {
      const { data: outras } = await supabase.from("questao_versions")
        .select("id").eq("doc_id", input.docId).neq("id", input.versionId)
        .order("version_number", { ascending: false }).limit(1);
      await supabase.from("questao_docs").update({ current_version_id: outras?.[0]?.id ?? null }).eq("id", input.docId);
    }

    await supabase.from("ai_generations").delete().eq("questao_version_id", input.versionId);
    const { error } = await supabase.from("questao_versions").delete().eq("id", input.versionId);
    if (error) throw error;
    revalidatePath("/admin/editora/criador-questoes");
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Exclui um documento (rascunho ou publicado). Despublica versões publicadas (imutáveis)
// antes de apagar, senão a trigger bloqueia o DELETE em cascata.
export async function excluirDoc(id: string): Promise<Result<null>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("questao_docs").select("slug").eq("id", id).maybeSingle();
    const { data: pubs } = await supabase.from("questao_versions").select("id").eq("doc_id", id).eq("is_published", true);
    for (const p of pubs ?? []) { const { error } = await supabase.rpc("unpublish_questao_version", { p_version_id: p.id }); if (error) throw error; }
    await supabase.from("questoes").update({ ativo: false }).eq("editora_doc_id", id); // remove do quiz (soft)
    const { error } = await supabase.from("questao_docs").delete().eq("id", id);
    if (error) throw error;
    await removerDaBiblioteca(supabase, "questao_docs", id);
    revalidatePath("/questoes"); revalidatePath("/admin/editora/criador-questoes");
    if (doc?.slug) revalidatePath(`/questoes/${doc.slug}`);
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// "Aplicar correções da IA": pega as afirmações da JUSTIFICATIVA cuja citação foi REPROVADA
// (clínicas/doses sem âncora válida), pede à IA (DeepSeek) para reancorar/ajustar/marcar sem
// fonte, aplica e REVALIDA por código (âncora inventada não conta). Não salva — devolve as
// questões corrigidas pro editor; o usuário confere e salva. Sobe a confiança conforme as
// referências realmente cobrem. Id posicional "questaoIndex:justIndex" (ex.: "2:0" = 1ª
// afirmação da justificativa da questão de índice 2).
export async function aplicarCorrecoes(input: { docId: string; questoes: QuestaoGerada[] }): Promise<Result<{ questoes: QuestaoGerada[]; validacao: Validacao; corrigidas: number; total: number }>> {
  try {
    await requireAdmin();
    const sres = await listarSources(input.docId);
    if (!sres.ok) return sres;
    const sources = sres.data;
    if (!input.questoes?.length) return { ok: false, error: "Gere as questões antes de corrigir." };

    // Identifica as afirmações reprovadas (clinica|dose sem âncora válida), varrendo a
    // justificativa de cada questão.
    const mapa = new Map(sources.map((s) => [s.id, normalizar(s.texto)]));
    const reprovada = (a: Afirmacao) => {
      if (a.tipo !== "clinica" && a.tipo !== "dose") return false;
      if (a.conferido) return false; // já validada manualmente pelo médico — não reancorar
      const txt = a.source_id ? mapa.get(a.source_id) : undefined;
      const anc = normalizar(a.ancora ?? "");
      return !(a.source_id && txt !== undefined && anc && txt.includes(anc));
    };
    const itens: ItemCorrigir[] = [];
    input.questoes.forEach((q, qi) => (q.justificativa ?? []).forEach((a, ji) => {
      if (reprovada(a)) itens.push({ id: `${qi}:${ji}`, secao: `Questão ${qi + 1}`, texto: a.texto, tipo: a.tipo });
    }));

    if (itens.length === 0) {
      return { ok: true, data: { questoes: input.questoes, validacao: consolidarValidacao(questoesToSecoes(input.questoes), sources), corrigidas: 0, total: 0 } };
    }

    const { correcoes } = await corrigirCitacoes({ itens, sources, prompt: buildCorrecaoQuestoesPrompt({ itens, sources }) });

    // Aplica as correções numa cópia; o código revalida depois.
    const novo: QuestaoGerada[] = input.questoes.map((q) => ({ ...q, justificativa: (q.justificativa ?? []).map((a) => ({ ...a })) }));
    for (const c of correcoes) {
      const [qi, ji] = c.id.split(":").map((n) => parseInt(n, 10));
      const alvo = novo[qi]?.justificativa?.[ji];
      if (!alvo) continue;
      alvo.texto = c.texto ?? alvo.texto;
      alvo.source_id = c.source_id ?? null;
      alvo.ancora = c.ancora ?? null;
      alvo.tipo = c.tipo ?? alvo.tipo;
    }

    const validacao = consolidarValidacao(questoesToSecoes(novo), sources); // REVALIDA por código (anti-trapaça)
    // Quantas das reprovadas agora ficaram válidas?
    const aindaReprovada = new Set<string>();
    novo.forEach((q, qi) => (q.justificativa ?? []).forEach((a, ji) => { if (reprovada(a)) aindaReprovada.add(`${qi}:${ji}`); }));
    const corrigidas = itens.filter((i) => !aindaReprovada.has(i.id)).length;

    return { ok: true, data: { questoes: novo, validacao, corrigidas, total: itens.length } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
