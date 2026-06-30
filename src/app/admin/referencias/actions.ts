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
    // NÃO seleciona "conteudo": livros têm ~MBs e puxar tudo pesaria a página em escala.
    const { data, error } = await supabase
      .from("kb_referencias")
      .select("id,titulo,tipo,autor,fonte_url,arquivo_url,area,ativo,criado_em")
      .order("criado_em", { ascending: false });
    if (error) throw error;
    // caracteres + trechos indexados por referência, via RPC (sem trazer o conteúdo)
    const chars = new Map<string, number>();
    const trechos = new Map<string, number>();
    try {
      const { data: statusRaw } = await supabase.rpc("kb_referencias_status");
      const rows: any[] = Array.isArray(statusRaw) ? statusRaw : [];
      for (const r of rows) { chars.set(r.id, Number(r.chars) || 0); trechos.set(r.id, Number(r.trechos) || 0); }
    } catch { /* status é opcional */ }
    const comStatus = (data ?? []).map((r: any) => ({ ...r, _chars: chars.get(r.id) ?? 0, _trechos: trechos.get(r.id) ?? 0 }));
    return { ok: true, data: comStatus };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function salvarReferencia(ref: {
  id?: string; titulo: string; tipo?: string; autor?: string; fonte_url?: string; arquivo_url?: string; conteudo?: string; area?: string; ativo?: boolean;
}): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    if (!ref.titulo?.trim()) return { ok: false, error: "Informe o título." };
    // Em CRIAÇÃO o conteúdo é obrigatório. Em EDIÇÃO, conteúdo vazio = só mexeu nos
    // metadados → preserva o texto existente (não apaga o livro já salvo).
    if (!ref.id && !ref.conteudo?.trim()) return { ok: false, error: "Cole o texto da referência (ou envie um PDF)." };
    const supabase = createServiceClient();
    const linha: Record<string, any> = {
      titulo: ref.titulo.trim(),
      tipo: ref.tipo || "Artigo",
      autor: ref.autor || null,
      fonte_url: ref.fonte_url || null,
      arquivo_url: ref.arquivo_url || null,
      area: ref.area || null,
      ativo: ref.ativo ?? true,
    };
    if (ref.conteudo?.trim()) linha.conteudo = ref.conteudo; // só grava conteúdo quando veio
    const { error } = ref.id
      ? await supabase.from("kb_referencias").update(linha).eq("id", ref.id)
      : await supabase.from("kb_referencias").insert(linha);
    if (error) throw error;
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

// Salva a referência EXTRAINDO o texto do PDF NO SERVIDOR (a partir do blob URL).
// O texto gigante (~MBs) nunca trafega pelo navegador → some o limite de payload e a
// fragilidade que fazia o livro "não salvar". Recebe só metadados + URL do blob.
export async function salvarReferenciaPdf(ref: {
  id?: string; titulo: string; tipo?: string; autor?: string; fonte_url?: string; area?: string; ativo?: boolean;
}, blobUrl: string): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    if (!blobUrl) return { ok: false, error: "PDF não enviado." };
    const ext = await extrairTextoPdf(blobUrl);
    if (!ext.ok || !ext.data?.trim()) return { ok: false, error: ext.error ?? "Não consegui extrair texto do PDF (pode ser escaneado/imagem)." };
    const r = await salvarReferencia({ ...ref, arquivo_url: blobUrl, conteudo: ext.data });
    return r.ok ? { ok: true, data: { chars: ext.data.length } } : r;
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
    return { ok: true, data: limpo.slice(0, 18000000) }; // teto alto p/ livros gigantes (ex.: Manica) entrarem inteiros
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
