"use server";

import { cookies } from "next/headers";
import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || token !== createHash("sha256").update(pw).digest("hex")) throw new Error("Não autorizado");
}

type Result = { ok: boolean; data?: any; error?: string };

export async function listarReferencias(): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("kb_referencias").select("*").order("criado_em", { ascending: false });
    if (error) throw error;
    return { ok: true, data };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function salvarReferencia(ref: {
  id?: string; titulo: string; tipo?: string; autor?: string; fonte_url?: string; arquivo_url?: string; conteudo?: string; area?: string; ativo?: boolean;
}): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    if (!ref.titulo?.trim()) return { ok: false, error: "Informe o título." };
    if (!ref.conteudo?.trim()) return { ok: false, error: "Cole o texto da referência (ou extraia de um PDF)." };
    const supabase = createServiceClient();
    const linha = {
      titulo: ref.titulo.trim(),
      tipo: ref.tipo || "Artigo",
      autor: ref.autor || null,
      fonte_url: ref.fonte_url || null,
      arquivo_url: ref.arquivo_url || null,
      conteudo: ref.conteudo,
      area: ref.area || null,
      ativo: ref.ativo ?? true,
    };
    const { error } = ref.id
      ? await supabase.from("kb_referencias").update(linha).eq("id", ref.id)
      : await supabase.from("kb_referencias").insert(linha);
    if (error) throw error;
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function excluirReferencia(id: string): Promise<Result> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { error } = await supabase.from("kb_referencias").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

// Extrai o texto de um PDF (blob privado) para preencher o conteúdo.
export async function extrairTextoPdf(url: string): Promise<Result> {
  try {
    await requireAdmin();
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return { ok: false, error: "Não consegui baixar o PDF." };
    const buf = new Uint8Array(await res.arrayBuffer());
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    const limpo = String(text || "").replace(/\s+/g, " ").trim();
    if (!limpo) return { ok: false, error: "Não foi possível extrair texto (PDF pode ser só imagem/escaneado)." };
    return { ok: true, data: limpo.slice(0, 200000) };
  } catch (e) { return { ok: false, error: "Falha ao ler o PDF: " + (e instanceof Error ? e.message : String(e)) }; }
}

// Reindexa o assistente (chama o indexador em processo, com o CRON_SECRET).
export async function reindexarAssistente(): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured() || !process.env.OPENAI_API_KEY) return { ok: false, error: "Configure Supabase e OpenAI." };
    const req = new NextRequest(new URL("https://internal/api/agents/index-kb"), {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const mod = await import("@/app/api/agents/index-kb/route");
    const res = await mod.POST(req);
    return { ok: res.ok, data: await res.json() };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}
