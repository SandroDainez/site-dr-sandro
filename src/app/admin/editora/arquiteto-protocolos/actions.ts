"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { slugify } from "@/lib/editora";
import { getProvider } from "@/lib/ai/providers";
import { aiProviders } from "@/lib/ai/config";
import { buildArquitetoProtocolosPrompt } from "@/lib/ai/prompts/arquiteto-protocolos";
import { validarSecoes, consolidarValidacao, normalizar, type Validacao } from "@/lib/ai/citations";
import { corrigirCitacoes } from "@/lib/ai/correcao";
import { buildCorrecaoProtocolosPrompt, type ItemCorrigir } from "@/lib/ai/prompts/correcao-protocolos";
import { searchPubMed } from "@/lib/assistente/search-pubmed";
import { getOpenAI } from "@/lib/ai/openai";
import type { Source, SecaoGerada, Issue } from "@/lib/ai/types";
import { PROTOCOLO_BLOCOS, mapEspecialidadeDB } from "@/lib/editora/protocolo-estrutura";
import { sincronizarBiblioteca, removerDaBiblioteca, textoConsolidadoDeSecoes } from "@/lib/editora/biblioteca";

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };
const msg = (e: unknown) => String(e instanceof Error ? e.message : e);

type ProtocoloResumo = { id: string; title: string; slug: string; status: string; specialty: string };

// Converte uma linha de protocol_sources para o shape Source do módulo de IA.
type SourceRow = { id: string; title?: string | null; source_type?: string | null; content?: string | null; metadata?: { autor?: string | null; ano?: number | null } | null };
function rowToSource(r: SourceRow): Source {
  const meta = r.metadata ?? {};
  return { id: r.id, titulo: r.title ?? "", tipo: r.source_type ?? "", autor: meta.autor ?? undefined, ano: meta.ano ?? null, texto: r.content ?? "" };
}

export async function listarProtocolos(): Promise<Result<ProtocoloResumo[]>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("protocols").select("id,title,slug,status,specialty").order("updated_at", { ascending: false });
    if (error) throw error;
    return { ok: true, data: (data ?? []) as ProtocoloResumo[] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function criarProtocolo(input: { title: string; especialidadeModulo: string }): Promise<Result<ProtocoloResumo>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const title = (input.title || "").trim();
    if (!title) return { ok: false, error: "Informe o título do protocolo." };
    // slug único
    let slug = slugify(title), n = 1;
    for (;;) {
      const { data } = await supabase.from("protocols").select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      n += 1; slug = `${slugify(title)}-${n}`;
    }
    const { data, error } = await supabase.from("protocols")
      .insert({ title, slug, specialty: mapEspecialidadeDB(input.especialidadeModulo), status: "draft", stage: "arquiteto-protocolos" })
      .select("id,title,slug,status,specialty").single();
    if (error) throw error;
    revalidatePath("/admin/editora/arquiteto-protocolos");
    return { ok: true, data: data as ProtocoloResumo };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function listarSources(protocolId: string): Promise<Result<Source[]>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("protocol_sources").select("*").eq("protocol_id", protocolId).order("created_at", { ascending: true });
    if (error) throw error;
    return { ok: true, data: (data ?? []).map(rowToSource) };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function adicionarSource(input: {
  protocolId: string; titulo: string; tipo: string; autor?: string; ano?: number | null; texto: string;
}): Promise<Result<Source>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    if (!(input.texto || "").trim()) return { ok: false, error: "Cole o texto da fonte." };
    const { data, error } = await supabase.from("protocol_sources").insert({
      protocol_id: input.protocolId,
      source_type: input.tipo || "artigo",
      title: (input.titulo || "").trim() || "Fonte sem título",
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
    const { error } = await supabase.from("protocol_sources").delete().eq("id", sourceId);
    if (error) throw error;
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Gera UM bloco (3-4 seções), recebendo os sources completos (do banco) + as seções
// já geradas como contexto. Valida as citações DO BLOCO antes de devolver.
export async function gerarBloco(input: {
  protocolId: string; blocoIndex: number; especialidade: string; secoesAnteriores: SecaoGerada[];
}): Promise<Result<{ secoes: SecaoGerada[]; validacaoBloco: Validacao; usage: { tokensIn: number; tokensOut: number }; provider: string; model: string }>> {
  try {
    await requireAdmin();
    const bloco = PROTOCOLO_BLOCOS[input.blocoIndex];
    if (!bloco) return { ok: false, error: "Bloco inválido." };

    const sres = await listarSources(input.protocolId);
    if (!sres.ok) return sres;
    const sources = sres.data;
    if (sources.length === 0) return { ok: false, error: "Adicione ao menos uma fonte antes de gerar." };

    // Monta o prompt (usado pelos providers reais; o mock ignora) e chama o provider.
    const prompt = buildArquitetoProtocolosPrompt({
      especialidade: input.especialidade, sources, secoesAlvo: bloco, secoesAnteriores: input.secoesAnteriores,
    });
    const provider = getProvider(aiProviders().generation); // mock | deepseek (AI_PROVIDER)
    const res = await provider.generate({
      modulo: "arquiteto-protocolos", especialidade: input.especialidade,
      sources, secoesAlvo: bloco, secoesAnteriores: input.secoesAnteriores, prompt,
    });

    // Valida citações DO BLOCO antes de prosseguir.
    const validacaoBloco = validarSecoes(res.secoes, sources);
    return { ok: true, data: { secoes: res.secoes, validacaoBloco, usage: res.usage, provider: res.provider, model: res.model } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// ESTÁGIO 2 — revisão do protocolo COMPLETO (GPT-4o). Aponta problemas + devolve versão
// corrigida à parte (não reescreve em silêncio). O confidence segue calculado pelo CÓDIGO.
export type RevisaoResultado = {
  issues: Issue[]; corrigido: SecaoGerada[]; usage: { tokensIn: number; tokensOut: number };
  provider: string; model: string; confidence: number; method: string;
};
export async function revisar(input: { protocolId: string; secoes: SecaoGerada[] }): Promise<Result<RevisaoResultado>> {
  try {
    await requireAdmin();
    const sres = await listarSources(input.protocolId);
    if (!sres.ok) return sres;
    const sources = sres.data;
    if (!input.secoes?.length) return { ok: false, error: "Gere o protocolo antes de revisar." };
    const provider = getProvider(aiProviders().review); // mock | openai/gpt-4o
    const rev = await provider.review({
      modulo: "arquiteto-protocolos",
      draft: { provider: "", model: "", secoes: input.secoes, usage: { tokensIn: 0, tokensOut: 0 } },
      sources,
    });
    const val = consolidarValidacao(input.secoes, sources); // confidence pelo CÓDIGO (não pela IA)
    return { ok: true, data: { issues: rev.issues, corrigido: rev.corrigido.secoes, usage: rev.usage, provider: rev.provider, model: rev.model, confidence: val.confidence, method: val.method } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Salva o resultado (possivelmente editado) como NOVA protocol_version (append-only) +
// registra a auditoria de IA POR ESTÁGIO: uma linha por bloco de geração + uma da revisão.
// Confidence GLOBAL recalculado pelo código contra os sources.
export async function salvarVersao(input: {
  protocolId: string;
  especialidade: string;
  secoes: SecaoGerada[];
  textoEditado?: Record<string, string>;
  geracoes: { blocoIndex: number; provider: string; model: string; tokensIn: number; tokensOut: number; secoes: SecaoGerada[]; confidence: number; method: string }[];
  revisao?: { provider: string; model: string; tokensIn: number; tokensOut: number; issues: Issue[]; corrigido: SecaoGerada[] };
}): Promise<Result<{ versionId: string; versionNumber: number; validacao: Validacao }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();

    const sres = await listarSources(input.protocolId);
    if (!sres.ok) return sres;
    const sources = sres.data;

    // Confidence GLOBAL pelo código.
    const validacao = consolidarValidacao(input.secoes, sources);

    // Próximo version_number (append-only).
    const { data: ult } = await supabase.from("protocol_versions")
      .select("version_number").eq("protocol_id", input.protocolId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const versionNumber = (ult?.version_number ?? 0) + 1;

    const content = {
      especialidade: input.especialidade,
      secoes: input.secoes,
      textoEditado: input.textoEditado ?? {},
      confidence: validacao.confidence,
      confidence_method: validacao.method,
    };

    const { data: ver, error: verErr } = await supabase.from("protocol_versions")
      .insert({ protocol_id: input.protocolId, version_number: versionNumber, content, is_published: false })
      .select("id").single();
    if (verErr) throw verErr;
    const versionId = ver.id as string;

    // current_version_id aponta para a nova versão.
    await supabase.from("protocols").update({ current_version_id: versionId, stage: "arquiteto-protocolos" }).eq("id", input.protocolId);

    // Auditoria: uma linha por bloco.
    if (input.geracoes?.length) {
      await supabase.from("ai_generations").insert(input.geracoes.map((g) => ({
        protocol_version_id: versionId,
        module_type: "arquiteto-protocolos",
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

    // Auditoria do ESTÁGIO 2 (revisão): linha separada, com apontamentos (warnings) +
    // versão corrigida (output). Não substitui o confidence do código — é camada adicional.
    if (input.revisao) {
      const r = input.revisao;
      await supabase.from("ai_generations").insert({
        protocol_version_id: versionId,
        module_type: "arquiteto-protocolos:review",
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

    revalidatePath("/admin/editora/arquiteto-protocolos");
    return { ok: true, data: { versionId, versionNumber, validacao } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// ── PUBLICAÇÃO / VERSIONAMENTO ────────────────────────────────────────────────
type VersaoResumo = { id: string; version_number: number; is_published: boolean; created_at: string };

export async function listarVersoes(protocolId: string): Promise<Result<VersaoResumo[]>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("protocol_versions")
      .select("id,version_number,is_published,created_at").eq("protocol_id", protocolId).order("version_number", { ascending: false });
    if (error) throw error;
    return { ok: true, data: (data ?? []) as VersaoResumo[] };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Revalida a listagem pública e a página do protocolo (padrão de cache do diagnóstico:
// dinâmico + revalidatePath sob demanda). Sem isso o Next serve versão velha.
function revalidarPublico(slug: string) {
  revalidatePath("/protocolos");
  revalidatePath(`/protocolos/${slug}`);
  revalidatePath("/admin/editora/arquiteto-protocolos");
}

export async function publicarProtocolo(protocolId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: prot } = await supabase.from("protocols").select("title,slug,specialty,areas").eq("id", protocolId).maybeSingle();
    if (!prot) return { ok: false, error: "Protocolo não encontrado." };

    // versão-alvo = a mais recente
    const { data: alvo } = await supabase.from("protocol_versions")
      .select("id,is_published,content").eq("protocol_id", protocolId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    if (!alvo) return { ok: false, error: "Gere e salve uma versão antes de publicar." };

    if (!alvo.is_published) {
      // despublica a versão publicada atual (imutável) via função controlada
      const { data: pubAtual } = await supabase.from("protocol_versions")
        .select("id").eq("protocol_id", protocolId).eq("is_published", true).maybeSingle();
      if (pubAtual && pubAtual.id !== alvo.id) {
        const { error: eUnp } = await supabase.rpc("unpublish_protocol_version", { p_version_id: pubAtual.id });
        if (eUnp) throw eUnp;
      }
      const { error: ePub } = await supabase.from("protocol_versions").update({ is_published: true }).eq("id", alvo.id);
      if (ePub) throw ePub;
    }

    const { error: eProt } = await supabase.from("protocols")
      .update({ status: "published", current_version_id: alvo.id }).eq("id", protocolId);
    if (eProt) throw eProt;

    const conteudo = alvo.content as { secoes?: SecaoGerada[]; textoEditado?: Record<string, string> };
    await sincronizarBiblioteca(supabase, {
      modulo: "arquiteto-protocolos", tabelaOrigem: "protocols", docId: protocolId,
      titulo: prot.title, slug: prot.slug, urlPublica: `/protocolos/${prot.slug}`,
      especialidade: prot.specialty, areas: prot.areas ?? [],
      texto: textoConsolidadoDeSecoes(conteudo.secoes ?? [], conteudo.textoEditado),
    });

    revalidarPublico(prot.slug);
    return { ok: true, data: { status: "published", slug: prot.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function despublicarProtocolo(protocolId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: prot } = await supabase.from("protocols").select("slug").eq("id", protocolId).maybeSingle();
    if (!prot) return { ok: false, error: "Protocolo não encontrado." };

    const { data: pub } = await supabase.from("protocol_versions").select("id").eq("protocol_id", protocolId).eq("is_published", true).maybeSingle();
    if (pub) { const { error } = await supabase.rpc("unpublish_protocol_version", { p_version_id: pub.id }); if (error) throw error; }

    const { error: e2 } = await supabase.from("protocols").update({ status: "ready_to_publish" }).eq("id", protocolId);
    if (e2) throw e2;
    await removerDaBiblioteca(supabase, "protocols", protocolId);
    revalidarPublico(prot.slug);
    return { ok: true, data: { status: "ready_to_publish", slug: prot.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

export async function arquivarProtocolo(protocolId: string): Promise<Result<{ status: string; slug: string }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: prot } = await supabase.from("protocols").select("slug").eq("id", protocolId).maybeSingle();
    if (!prot) return { ok: false, error: "Protocolo não encontrado." };

    const { data: pub } = await supabase.from("protocol_versions").select("id").eq("protocol_id", protocolId).eq("is_published", true).maybeSingle();
    if (pub) { const { error } = await supabase.rpc("unpublish_protocol_version", { p_version_id: pub.id }); if (error) throw error; }

    const { error: e2 } = await supabase.from("protocols").update({ status: "archived" }).eq("id", protocolId);
    if (e2) throw e2;
    await removerDaBiblioteca(supabase, "protocols", protocolId);
    revalidarPublico(prot.slug);
    return { ok: true, data: { status: "archived", slug: prot.slug } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Exclui um documento (rascunho ou publicado). Despublica versões publicadas (imutáveis)
// antes de apagar, senão a trigger bloqueia o DELETE em cascata.
export async function excluirDoc(id: string): Promise<Result<null>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: doc } = await supabase.from("protocols").select("slug").eq("id", id).maybeSingle();
    const { data: pubs } = await supabase.from("protocol_versions").select("id").eq("protocol_id", id).eq("is_published", true);
    for (const p of pubs ?? []) { const { error } = await supabase.rpc("unpublish_protocol_version", { p_version_id: p.id }); if (error) throw error; }
    const { error } = await supabase.from("protocols").delete().eq("id", id);
    if (error) throw error;
    await removerDaBiblioteca(supabase, "protocols", id);
    revalidatePath("/protocolos"); revalidatePath("/admin/editora/arquiteto-protocolos");
    if (doc?.slug) revalidatePath(`/protocolos/${doc.slug}`);
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Exclui UMA versão (rascunho). A versão publicada não pode ser excluída (está no ar —
// despublique antes). Se for a versão corrente, reaponta current_version_id para a última
// restante. Remove antes as linhas de auditoria (ai_generations) daquela versão (FK).
export async function excluirVersao(input: { protocolId: string; versionId: string }): Promise<Result<null>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data: v } = await supabase.from("protocol_versions").select("id, is_published").eq("id", input.versionId).maybeSingle();
    if (!v) return { ok: false, error: "Versão não encontrada." };
    if (v.is_published) return { ok: false, error: "Esta versão está publicada (no ar). Despublique antes de excluí-la." };

    // Se for a versão corrente, reaponta para a última versão restante (ou null).
    const { data: prot } = await supabase.from("protocols").select("current_version_id").eq("id", input.protocolId).maybeSingle();
    if (prot?.current_version_id === input.versionId) {
      const { data: outras } = await supabase.from("protocol_versions")
        .select("id").eq("protocol_id", input.protocolId).neq("id", input.versionId)
        .order("version_number", { ascending: false }).limit(1);
      await supabase.from("protocols").update({ current_version_id: outras?.[0]?.id ?? null }).eq("id", input.protocolId);
    }

    await supabase.from("ai_generations").delete().eq("protocol_version_id", input.versionId);
    const { error } = await supabase.from("protocol_versions").delete().eq("id", input.versionId);
    if (error) throw error;
    revalidatePath("/admin/editora/arquiteto-protocolos");
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Imagem/infográfico: ver src/app/admin/editora/imagem-actions.ts (genérico, tabela+docId).

// Carrega o CONTEÚDO de uma versão salva (secoes + textoEditado + especialidade) para
// reabrir no editor e editar. Editar + salvar cria uma nova versão (append-only).
export async function carregarVersao(versionId: string): Promise<Result<{ especialidade: string; secoes: SecaoGerada[]; textoEditado: Record<string, string> }>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("protocol_versions").select("content").eq("id", versionId).maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false, error: "Versão não encontrada." };
    const c = (data.content ?? {}) as { especialidade?: string; secoes?: SecaoGerada[]; textoEditado?: Record<string, string> };
    return { ok: true, data: { especialidade: c.especialidade ?? "", secoes: Array.isArray(c.secoes) ? c.secoes : [], textoEditado: c.textoEditado ?? {} } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// "Aplicar correções da IA": pega as afirmações cuja citação foi REPROVADA (clínicas/doses
// sem âncora válida), pede à IA (DeepSeek) para reancorar/ajustar/marcar sem fonte, aplica e
// REVALIDA por código (âncora inventada não conta). Não salva — devolve as seções corrigidas
// pro editor; o usuário confere e salva. Sobe a confiança conforme as fontes realmente cobrem.
export async function aplicarCorrecoes(input: { protocolId: string; secoes: SecaoGerada[] }): Promise<Result<{ secoes: SecaoGerada[]; validacao: Validacao; corrigidas: number; total: number; fontesExternas: number }>> {
  try {
    await requireAdmin();
    const sres = await listarSources(input.protocolId);
    if (!sres.ok) return sres;
    const sources = sres.data;
    if (!input.secoes?.length) return { ok: false, error: "Gere o protocolo antes de corrigir." };

    // `sources` cresce se buscarmos fontes externas; `mapa` (id → texto normalizado) é
    // reconstruído a cada mudança para a revalidação por código enxergar as novas fontes.
    let mapa = new Map(sources.map((s) => [s.id, normalizar(s.texto)]));
    const rebuildMapa = () => { mapa = new Map(sources.map((s) => [s.id, normalizar(s.texto)])); };
    const reprovada = (a: SecaoGerada["afirmacoes"][number]) => {
      if (a.tipo !== "clinica" && a.tipo !== "dose") return false;
      if (a.conferido) return false; // já validada manualmente pelo médico — não reancorar
      const txt = a.source_id ? mapa.get(a.source_id) : undefined;
      const anc = normalizar(a.ancora ?? "");
      return !(a.source_id && txt !== undefined && anc && txt.includes(anc));
    };
    const itensDe = (): ItemCorrigir[] => {
      const out: ItemCorrigir[] = [];
      novo.forEach((sec, si) => (sec.afirmacoes ?? []).forEach((a, ai) => {
        if (reprovada(a)) out.push({ id: `${si}:${ai}`, secao: sec.secao, texto: a.texto, tipo: a.tipo });
      }));
      return out;
    };

    // Cópia editável; o código revalida sempre depois de aplicar.
    const novo: SecaoGerada[] = input.secoes.map((sec) => ({ ...sec, afirmacoes: (sec.afirmacoes ?? []).map((a) => ({ ...a })) }));
    const aplicar = (correcoes: Awaited<ReturnType<typeof corrigirCitacoes>>["correcoes"]) => {
      for (const c of correcoes) {
        const [si, ai] = c.id.split(":").map((n) => parseInt(n, 10));
        const alvo = novo[si]?.afirmacoes?.[ai];
        if (!alvo) continue;
        alvo.texto = c.texto ?? alvo.texto;
        alvo.source_id = c.source_id ?? null;
        alvo.ancora = c.ancora ?? null;
        alvo.tipo = c.tipo ?? alvo.tipo;
      }
    };

    const itensIniciais = itensDe();
    const total = itensIniciais.length;
    if (total === 0) {
      return { ok: true, data: { secoes: input.secoes, validacao: consolidarValidacao(input.secoes, sources), corrigidas: 0, total: 0, fontesExternas: 0 } };
    }

    // ── Passo 1: reancorar nas fontes já anexadas (biblioteca) ──────────────────
    const p1 = await corrigirCitacoes({ itens: itensIniciais, sources, prompt: buildCorrecaoProtocolosPrompt({ itens: itensIniciais, sources }) });
    aplicar(p1.correcoes);

    // ── Passo 2: o que sobrou sem fonte → buscar suporte REAL no PubMed ─────────
    // Anexa o abstract como fonte do protocolo e reancora. O código revalida (o trecho
    // tem que existir literalmente no abstract) — nada é inventado; se não sustentar, fica.
    let fontesExternas = 0;
    const restantes = itensDe();
    if (restantes.length > 0) {
      let openai: ReturnType<typeof getOpenAI> | null = null;
      try { openai = getOpenAI(); } catch { openai = null; } // sem chave OpenAI → pula busca externa
      if (openai) {
        const pmidsAdicionados = new Set(sources.map((s) => String((s as { pmid?: string }).pmid ?? "")));
        for (const item of restantes.slice(0, 12)) { // teto de segurança (custo/tempo)
          let hits: Awaited<ReturnType<typeof searchPubMed>> = [];
          try { hits = await searchPubMed(openai, item.texto); } catch { hits = []; }
          const hit = hits.find((h) => h.resumo && h.resumo.trim().length > 40 && !pmidsAdicionados.has(h.pmid));
          if (!hit) continue;
          const add = await adicionarSource({
            protocolId: input.protocolId, titulo: hit.titulo || `PubMed ${hit.pmid}`, tipo: "pubmed",
            autor: hit.autores || undefined, ano: hit.ano ? parseInt(hit.ano, 10) : null, texto: hit.resumo,
          });
          if (add.ok) { sources.push(add.data); pmidsAdicionados.add(hit.pmid); fontesExternas++; }
        }
        if (fontesExternas > 0) {
          rebuildMapa();
          const itens2 = itensDe();
          if (itens2.length > 0) {
            const p2 = await corrigirCitacoes({ itens: itens2, sources, prompt: buildCorrecaoProtocolosPrompt({ itens: itens2, sources }) });
            aplicar(p2.correcoes);
          }
        }
      }
    }

    rebuildMapa();
    const validacao = consolidarValidacao(novo, sources); // REVALIDA por código (anti-trapaça)
    const aindaReprovada = new Set(itensDe().map((i) => i.id));
    const corrigidas = itensIniciais.filter((i) => !aindaReprovada.has(i.id)).length;

    return { ok: true, data: { secoes: novo, validacao, corrigidas, total, fontesExternas } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
