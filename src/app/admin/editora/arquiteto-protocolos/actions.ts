"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { slugify } from "@/lib/editora";
import { getProvider } from "@/lib/ai/providers";
import { buildArquitetoProtocolosPrompt } from "@/lib/ai/prompts/arquiteto-protocolos";
import { validarSecoes, consolidarValidacao, type Validacao } from "@/lib/ai/citations";
import type { Source, SecaoGerada } from "@/lib/ai/types";
import { PROTOCOLO_BLOCOS, mapEspecialidadeDB } from "@/lib/editora/protocolo-estrutura";

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
    const provider = getProvider("mock"); // piloto: só mock
    const res = await provider.generate({
      modulo: "arquiteto-protocolos", especialidade: input.especialidade,
      sources, secoesAlvo: bloco, secoesAnteriores: input.secoesAnteriores, prompt,
    });

    // Valida citações DO BLOCO antes de prosseguir.
    const validacaoBloco = validarSecoes(res.secoes, sources);
    return { ok: true, data: { secoes: res.secoes, validacaoBloco, usage: res.usage, provider: res.provider, model: res.model } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

// Salva o resultado (possivelmente editado) como NOVA protocol_version (append-only) +
// registra a auditoria de IA (uma linha ai_generations por bloco), com confidence GLOBAL
// recalculado pelo código contra os sources.
export async function salvarVersao(input: {
  protocolId: string;
  especialidade: string;
  secoes: SecaoGerada[];
  textoEditado?: Record<string, string>;
  geracoes: { blocoIndex: number; provider: string; model: string; tokensIn: number; tokensOut: number; secoes: SecaoGerada[]; confidence: number; method: string }[];
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

    revalidatePath("/admin/editora/arquiteto-protocolos");
    return { ok: true, data: { versionId, versionNumber, validacao } };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
