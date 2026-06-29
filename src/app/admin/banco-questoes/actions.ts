"use server";

import { cookies } from "next/headers";
import { createHash } from "crypto";
import OpenAI from "openai";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { embedUm, toVector } from "@/lib/agents/embeddings";

async function requireAdmin() {
  const c = await cookies();
  const token = c.get("admin_token")?.value;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || token !== createHash("sha256").update(pw).digest("hex")) throw new Error("Não autorizado");
}
type Result = { ok: boolean; data?: any; error?: string };

export async function listarQuestoes(): Promise<Result> {
  try {
    await requireAdmin();
    const sb = createServiceClient();
    const { data, error } = await sb.from("questoes").select("*").order("criado_em", { ascending: false }).limit(1000);
    if (error) throw error;
    return { ok: true, data };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function salvarQuestao(q: { id?: string; enunciado: string; opcoes: string[]; correta: number; explicacao?: string; area?: string; tema?: string; nivel?: string; fonte_url?: string; ativo?: boolean }): Promise<Result> {
  try {
    await requireAdmin();
    const opcoes = (q.opcoes || []).map((o) => o.trim()).filter(Boolean);
    if (!q.enunciado?.trim() || opcoes.length < 2) return { ok: false, error: "Enunciado e ao menos 2 alternativas." };
    const linha = { enunciado: q.enunciado.trim(), opcoes, correta: Math.min(q.correta ?? 0, opcoes.length - 1), explicacao: q.explicacao || null, area: q.area || null, tema: q.tema || null, nivel: q.nivel || null, fonte_url: q.fonte_url || null, ativo: q.ativo ?? true };
    const sb = createServiceClient();
    const { error } = q.id ? await sb.from("questoes").update(linha).eq("id", q.id) : await sb.from("questoes").insert(linha);
    if (error) throw error;
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function excluirQuestao(id: string): Promise<Result> {
  try { await requireAdmin(); const sb = createServiceClient(); const { error } = await sb.from("questoes").delete().eq("id", id); if (error) throw error; return { ok: true }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function alternarAtivo(id: string, ativo: boolean): Promise<Result> {
  try { await requireAdmin(); const sb = createServiceClient(); const { error } = await sb.from("questoes").update({ ativo }).eq("id", id); if (error) throw error; return { ok: true }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

// Gera questões por IA ANCORADAS no conteúdo do portal (RAG). Entram como RASCUNHO
// (ativo=false) — o admin revisa e ativa. Nunca vão direto para os alunos.
export async function gerarQuestoesIA(tema: string, area: string, quantidade: number): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured() || !process.env.OPENAI_API_KEY) return { ok: false, error: "Configure Supabase e OpenAI." };
    if (!tema?.trim()) return { ok: false, error: "Informe o tema." };
    const n = Math.max(1, Math.min(10, quantidade || 5));
    const sb = createServiceClient();

    // contexto do portal
    let contexto = "";
    try {
      const vec = await embedUm(`${tema} ${area}`);
      const { data: trechos } = await sb.rpc("match_kb", { query_embedding: toVector(vec), match_count: 8 });
      contexto = (trechos ?? []).map((t: any, i: number) => `[${i + 1}] ${t.conteudo}`).join("\n\n");
    } catch { contexto = ""; }
    if (!contexto) return { ok: false, error: "Sem conteúdo no portal sobre esse tema ainda. Adicione referências/boletins e reindexe o assistente antes de gerar questões." };

    const prompt = `Você é um elaborador de questões de prova para médicos especialistas em ${area || "medicina"}.
Gere ${n} questões de MÚLTIPLA ESCOLHA sobre "${tema}", BASEADAS SOMENTE no CONTEXTO abaixo (conteúdo curado do portal). Não invente fatos fora do contexto.
Cada questão: enunciado (pode ser caso clínico), 4 alternativas e explicação.

FORMATO ESTRITO de cada item:
- "opcoes": array de strings SEM prefixo de letra (NÃO escreva "A)", "B)" — só o texto da alternativa).
- "correta": NÚMERO inteiro = o ÍNDICE (começando em 0) da alternativa correta dentro de "opcoes".

CONTEXTO:
${contexto}

Retorne APENAS JSON: {"questoes":[{"enunciado":"...","opcoes":["texto 1","texto 2","texto 3","texto 4"],"correta":0,"explicacao":"..."}]}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 2500, response_format: { type: "json_object" } });
    const parsed = JSON.parse(r.choices[0].message.content ?? "{}");
    const qs: any[] = Array.isArray(parsed.questoes) ? parsed.questoes : [];
    if (qs.length === 0) return { ok: false, error: "A IA não gerou questões. Tente outro tema." };

    // remove SÓ rótulo de enumeração ("A) ", "1. ", "(B) ") — exige terminador )/./: + ESPAÇO.
    // NÃO remove número que faz parte do valor (ex.: "0,3 mg/kg", "2 mg/kg", "0.2 mg/kg").
    const limpaOp = (o: any) => String(o).replace(/^\s*\(?[A-Ea-e0-9]{1,2}\)?\s*[).:-]\s+/, "").trim();
    // resolve a correta seja índice, letra ("B") ou o texto da alternativa
    const resolveCorreta = (c: any, ops: string[]): number => {
      if (typeof c === "number" && c >= 0 && c < ops.length) return c;
      const s = String(c ?? "").trim();
      if (/^\d+$/.test(s)) return Math.min(Number(s), ops.length - 1);
      const letra = s.match(/^[A-Ea-e]\b/);
      if (letra) { const i = letra[0].toUpperCase().charCodeAt(0) - 65; if (i >= 0 && i < ops.length) return i; }
      const txt = limpaOp(s);
      const i = ops.findIndex((o) => o.toLowerCase() === txt.toLowerCase());
      return i >= 0 ? i : 0;
    };
    const linhas = qs.filter((q) => q.enunciado && Array.isArray(q.opcoes) && q.opcoes.length >= 2).map((q) => {
      const opcoes = q.opcoes.map(limpaOp);
      return { enunciado: String(q.enunciado), opcoes, correta: resolveCorreta(q.correta, opcoes), explicacao: q.explicacao ? String(q.explicacao) : null, area: area || null, tema: tema.trim(), nivel: null, fonte_url: null, ativo: false };
    });
    const { error } = await sb.from("questoes").insert(linhas);
    if (error) throw error;
    return { ok: true, data: { criadas: linhas.length } };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}
