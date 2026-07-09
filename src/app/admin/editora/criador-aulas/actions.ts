"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { slugify } from "@/lib/editora";
import { getProvider } from "@/lib/ai/providers";
import { aiProviders } from "@/lib/ai/config";
import { buildCriadorAulasPrompt } from "@/lib/ai/prompts/criador-aulas";
import { validarSecoes, consolidarValidacao, normalizar, type Validacao } from "@/lib/ai/citations";
import { corrigirCitacoes } from "@/lib/ai/correcao";
import { buildCorrecaoAulasPrompt, type ItemCorrigir } from "@/lib/ai/prompts/correcao-aulas";
import type { Source, SecaoGerada, Issue } from "@/lib/ai/types";
import { AULA_BLOCOS, mapEspecialidadeDB } from "@/lib/editora/aula-estrutura";

// Criador de Aulas — mesma modelagem/pipeline validados, sobre as tabelas aula_docs /
// aula_versions / aula_sources (migration 005). Geração DeepSeek + revisão GPT-4o
// (AI_PROVIDER); confidence pelo CÓDIGO. module_type = 'criador-aulas'.

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
    const { data, error } = await supabase.from("aula_docs").select("id,title,slug,status,specialty").order("updated_at", { ascending: false });
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
    if (!title) return { ok: false, error: "Informe o título da aula." };
    let slug = slugify(title), n = 1;
    for (;;) {
      const { data } = await supabase.from("aula_docs").select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      n += 1; slug = `${slugify(title)}-${n}`;
    }
    const { data, error } = await supabase.from("aula_docs")
      .insert({ title, slug, specialty: mapEspecialidadeDB(input.especialidadeModulo), status: "draft", stage: "criador-aulas" })
      .select("id,title,slug,status,specialty").single();
    if (error) throw error;
    revalidatePath("/admin/editora/criador-aulas");
    return { ok: true, data: data as DocResumo };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function listarSources(docId: string): Promise<Result<Source[]>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("aula_sources").select("*").eq("doc_id", docId).order("created_at", { ascending: true });
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
    const { data, error } = await supabase.from("aula_sources").insert({
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
    const { error } = await supabase.from("aula_sources").delete().eq("id", sourceId);
    if (error) throw error;
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Gera UM bloco de seções (slides), com sources + público-alvo + seções anteriores.
export async function gerarBloco(input: {
  docId: string; blocoIndex: number; especialidade: string; publicoAlvo: string; duracaoAlvo?: string; secoesAnteriores: SecaoGerada[];
}): Promise<Result<{ secoes: SecaoGerada[]; validacaoBloco: Validacao; usage: { tokensIn: number; tokensOut: number }; provider: string; model: string }>> {
  try {
    await requireAdmin();
    const bloco = AULA_BLOCOS[input.blocoIndex];
    if (!bloco) return { ok: false, error: "Bloco inválido." };

    const sres = await listarSources(input.docId);
    if (!sres.ok) return sres;
    const sources = sres.data;
    if (sources.length === 0) return { ok: false, error: "Adicione ao menos uma referência antes de gerar." };

    const prompt = buildCriadorAulasPrompt({
      especialidade: input.especialidade, publicoAlvo: input.publicoAlvo, duracaoAlvo: input.duracaoAlvo, sources, secoesAlvo: bloco, secoesAnteriores: input.secoesAnteriores,
    });
    const provider = getProvider(aiProviders().generation);
    const res = await provider.generate({
      modulo: "criador-aulas", especialidade: input.especialidade,
      sources, secoesAlvo: bloco, secoesAnteriores: input.secoesAnteriores, prompt,
    });

    const validacaoBloco = validarSecoes(res.secoes, sources);
    return { ok: true, data: { secoes: res.secoes, validacaoBloco, usage: res.usage, provider: res.provider, model: res.model } };
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
    if (!input.secoes?.length) return { ok: false, error: "Gere a aula antes de revisar." };
    const provider = getProvider(aiProviders().review);
    const rev = await provider.review({
      modulo: "criador-aulas",
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
  publicoAlvo: string;
  duracaoAlvo?: string;
  secoes: SecaoGerada[];
  textoEditado?: Record<string, string>;
  geracoes: { blocoIndex: number; provider: string; model: string; tokensIn: number; tokensOut: number; secoes: SecaoGerada[]; confidence: number; method: string }[];
  revisao?: { provider: string; model: string; tokensIn: number; tokensOut: number; issues: Issue[]; corrigido: SecaoGerada[] };
}): Promise<Result<{ versionId: string; versionNumber: number; validacao: Validacao }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();

    const sres = await listarSources(input.docId);
    if (!sres.ok) return sres;
    const sources = sres.data;

    const validacao = consolidarValidacao(input.secoes, sources);

    const { data: ult } = await supabase.from("aula_versions")
      .select("version_number").eq("doc_id", input.docId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const versionNumber = (ult?.version_number ?? 0) + 1;

    const content = {
      especialidade: input.especialidade,
      publicoAlvo: input.publicoAlvo,
      duracaoAlvo: input.duracaoAlvo,
      secoes: input.secoes,
      textoEditado: input.textoEditado ?? {},
      referencias: snapshotReferencias(input.secoes, sources),
      confidence: validacao.confidence,
      confidence_method: validacao.method,
    };

    const { data: ver, error: verErr } = await supabase.from("aula_versions")
      .insert({ doc_id: input.docId, version_number: versionNumber, content, is_published: false })
      .select("id").single();
    if (verErr) throw verErr;
    const versionId = ver.id as string;

    await supabase.from("aula_docs").update({ current_version_id: versionId, stage: "criador-aulas" }).eq("id", input.docId);

    if (input.geracoes?.length) {
      await supabase.from("ai_generations").insert(input.geracoes.map((g) => ({
        aula_version_id: versionId,
        module_type: "criador-aulas",
        provider: g.provider,
        model: g.model,
        tokens_in: g.tokensIn,
        tokens_out: g.tokensOut,
        output: { secoes: g.secoes },
        citations: g.secoes.flatMap((s) => s.afirmacoes),
        confidence_level: g.confidence,
        confidence_method: g.method,
      })));
    }

    if (input.revisao) {
      const r = input.revisao;
      await supabase.from("ai_generations").insert({
        aula_version_id: versionId,
        module_type: "criador-aulas:review",
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

    revalidatePath("/admin/editora/criador-aulas");
    return { ok: true, data: { versionId, versionNumber, validacao } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Carrega o CONTEÚDO de uma versão salva (secoes + textoEditado + especialidade +
// publicoAlvo) para reabrir no editor e editar. Editar + salvar cria uma nova versão.
export async function carregarVersao(versionId: string): Promise<Result<{ especialidade: string; publicoAlvo: string; duracaoAlvo: string; secoes: SecaoGerada[]; textoEditado: Record<string, string> }>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("aula_versions").select("content").eq("id", versionId).maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false, error: "Versão não encontrada." };
    const c = (data.content ?? {}) as { especialidade?: string; publicoAlvo?: string; duracaoAlvo?: string; secoes?: SecaoGerada[]; textoEditado?: Record<string, string> };
    return { ok: true, data: { especialidade: c.especialidade ?? "", publicoAlvo: c.publicoAlvo ?? "", duracaoAlvo: c.duracaoAlvo ?? "", secoes: Array.isArray(c.secoes) ? c.secoes : [], textoEditado: c.textoEditado ?? {} } };
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
    const { data: v } = await supabase.from("aula_versions").select("id, is_published").eq("id", input.versionId).maybeSingle();
    if (!v) return { ok: false, error: "Versão não encontrada." };
    if (v.is_published) return { ok: false, error: "Esta versão está publicada (no ar). Despublique antes de excluí-la." };

    // Se for a versão corrente, reaponta para a última versão restante (ou null).
    const { data: doc } = await supabase.from("aula_docs").select("current_version_id").eq("id", input.docId).maybeSingle();
    if (doc?.current_version_id === input.versionId) {
      const { data: outras } = await supabase.from("aula_versions")
        .select("id").eq("doc_id", input.docId).neq("id", input.versionId)
        .order("version_number", { ascending: false }).limit(1);
      await supabase.from("aula_docs").update({ current_version_id: outras?.[0]?.id ?? null }).eq("id", input.docId);
    }

    await supabase.from("ai_generations").delete().eq("aula_version_id", input.versionId);
    const { error } = await supabase.from("aula_versions").delete().eq("id", input.versionId);
    if (error) throw error;
    revalidatePath("/admin/editora/criador-aulas");
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// "Aplicar correções da IA": pega as afirmações cuja citação foi REPROVADA (clínicas/doses
// sem âncora válida), pede à IA (DeepSeek) para reancorar/ajustar/marcar sem fonte, aplica e
// REVALIDA por código (âncora inventada não conta). Não salva — devolve as seções corrigidas
// pro editor; o usuário confere e salva. Sobe a confiança conforme as referências realmente cobrem.
export async function aplicarCorrecoes(input: { docId: string; secoes: SecaoGerada[] }): Promise<Result<{ secoes: SecaoGerada[]; validacao: Validacao; corrigidas: number; total: number }>> {
  try {
    await requireAdmin();
    const sres = await listarSources(input.docId);
    if (!sres.ok) return sres;
    const sources = sres.data;
    if (!input.secoes?.length) return { ok: false, error: "Gere a aula antes de corrigir." };

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

    const { correcoes } = await corrigirCitacoes({ itens, sources, prompt: buildCorrecaoAulasPrompt({ itens, sources }) });

    // Aplica as correções numa cópia; o código revalida depois.
    const novo: SecaoGerada[] = input.secoes.map((sec) => ({ ...sec, afirmacoes: (sec.afirmacoes ?? []).map((a) => ({ ...a })) }));
    for (const c of correcoes) {
      const [si, ai] = c.id.split(":").map((n) => parseInt(n, 10));
      const alvo = novo[si]?.afirmacoes?.[ai];
      if (!alvo) continue;
      alvo.texto = c.texto ?? alvo.texto;
      alvo.source_id = c.source_id ?? null;
      alvo.ancora = c.ancora ?? null;
      alvo.tipo = c.tipo ?? alvo.tipo;
    }

    const validacao = consolidarValidacao(novo, sources); // REVALIDA por código (anti-trapaça)
    // Quantas das reprovadas agora ficaram válidas?
    const aindaReprovada = new Set<string>();
    novo.forEach((sec, si) => (sec.afirmacoes ?? []).forEach((a, ai) => { if (reprovada(a)) aindaReprovada.add(`${si}:${ai}`); }));
    const corrigidas = itens.filter((i) => !aindaReprovada.has(i.id)).length;

    return { ok: true, data: { secoes: novo, validacao, corrigidas, total: itens.length } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// ── PUBLICAÇÃO / VERSIONAMENTO ────────────────────────────────────────────────
type VersaoResumo = { id: string; version_number: number; is_published: boolean; created_at: string };

export async function listarVersoes(docId: string): Promise<Result<VersaoResumo[]>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("aula_versions")
      .select("id,version_number,is_published,created_at").eq("doc_id", docId).order("version_number", { ascending: false });
    if (error) throw error;
    return { ok: true, data: (data ?? []) as VersaoResumo[] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

function revalidarPublico(slug: string) {
  revalidatePath("/aulas");
  revalidatePath(`/aulas/${slug}`);
  revalidatePath("/admin/editora/criador-aulas");
}

export async function publicarDoc(docId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("aula_docs").select("slug").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Aula não encontrada." };

    const { data: alvo } = await supabase.from("aula_versions")
      .select("id,is_published").eq("doc_id", docId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    if (!alvo) return { ok: false, error: "Gere e salve uma versão antes de publicar." };

    if (!alvo.is_published) {
      const { data: pubAtual } = await supabase.from("aula_versions")
        .select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
      if (pubAtual && pubAtual.id !== alvo.id) {
        const { error: eUnp } = await supabase.rpc("unpublish_aula_version", { p_version_id: pubAtual.id });
        if (eUnp) throw eUnp;
      }
      const { error: ePub } = await supabase.from("aula_versions").update({ is_published: true }).eq("id", alvo.id);
      if (ePub) throw ePub;
    }

    const { error: eDoc } = await supabase.from("aula_docs")
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
    const { data: doc } = await supabase.from("aula_docs").select("slug").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Aula não encontrada." };

    const { data: pub } = await supabase.from("aula_versions").select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
    if (pub) { const { error } = await supabase.rpc("unpublish_aula_version", { p_version_id: pub.id }); if (error) throw error; }

    const { error: e2 } = await supabase.from("aula_docs").update({ status: "ready_to_publish" }).eq("id", docId);
    if (e2) throw e2;
    revalidarPublico(doc.slug);
    return { ok: true, data: { status: "ready_to_publish", slug: doc.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function arquivarDoc(docId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("aula_docs").select("slug").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Aula não encontrada." };

    const { data: pub } = await supabase.from("aula_versions").select("id").eq("doc_id", docId).eq("is_published", true).maybeSingle();
    if (pub) { const { error } = await supabase.rpc("unpublish_aula_version", { p_version_id: pub.id }); if (error) throw error; }

    const { error: e2 } = await supabase.from("aula_docs").update({ status: "archived" }).eq("id", docId);
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
    const { data: doc } = await supabase.from("aula_docs").select("slug").eq("id", id).maybeSingle();
    const { data: pubs } = await supabase.from("aula_versions").select("id").eq("doc_id", id).eq("is_published", true);
    for (const p of pubs ?? []) { const { error } = await supabase.rpc("unpublish_aula_version", { p_version_id: p.id }); if (error) throw error; }
    const { error } = await supabase.from("aula_docs").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/aulas"); revalidatePath("/admin/editora/criador-aulas");
    if (doc?.slug) revalidatePath(`/aulas/${doc.slug}`);
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
