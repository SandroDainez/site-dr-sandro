"use server";

import { cookies } from "next/headers";
import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { chatJSON } from "@/lib/ai/openai";
import { slugify, type Artigo, type ArtigoEspecialidade } from "@/lib/editora";

async function requireAdmin() {
  const c = await cookies();
  const token = c.get("admin_token")?.value;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || token !== createHash("sha256").update(pw).digest("hex")) throw new Error("Não autorizado");
}

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

function msg(e: unknown): string {
  return String(e instanceof Error ? e.message : e);
}

// Gera um slug único (acrescenta -2, -3... se colidir). Ignora o próprio artigo (edição).
async function slugUnico(
  supabase: ReturnType<typeof createServiceClient>,
  base: string,
  id?: string
): Promise<string> {
  const raiz = slugify(base);
  let slug = raiz;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await supabase.from("editora_artigos").select("id").eq("slug", slug).maybeSingle();
    if (!data || data.id === id) return slug;
    n += 1;
    slug = `${raiz}-${n}`;
  }
}

export async function salvarArtigo(input: Partial<Artigo>): Promise<Result<Artigo>> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();

    const titulo = (input.titulo ?? "").trim();
    if (!titulo) return { ok: false, error: "Informe o título." };

    const slug = await slugUnico(supabase, (input.slug || "").trim() || titulo, input.id);
    const now = new Date().toISOString();
    const publicar = input.status === "publicado";

    const row = {
      titulo,
      slug,
      resumo: input.resumo ?? "",
      corpo: input.corpo ?? "",
      autor: input.autor ?? "",
      especialidade: (input.especialidade ?? "geral") as ArtigoEspecialidade,
      capa_url: input.capa_url ?? "",
      status: publicar ? "publicado" : "rascunho",
      atualizado_em: now,
      publicado_em: publicar ? input.publicado_em ?? now : null,
    };

    let saved: Artigo;
    if (input.id) {
      const { data, error } = await supabase.from("editora_artigos").update(row).eq("id", input.id).select().single();
      if (error) throw error;
      saved = data as Artigo;
    } else {
      const { data, error } = await supabase.from("editora_artigos").insert(row).select().single();
      if (error) throw error;
      saved = data as Artigo;
    }

    revalidatePath("/artigos");
    revalidatePath(`/artigos/${slug}`);
    revalidatePath("/");
    return { ok: true, data: saved };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function excluirArtigo(id: string): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase não configurado." };
    const supabase = createServiceClient();
    const { error } = await supabase.from("editora_artigos").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/artigos");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

// Rascunho gerado por IA a partir de um tema. Reaproveita a camada src/lib/ai (chatJSON).
export async function gerarArtigoIA(
  tema: string,
  especialidade: string
): Promise<Result<{ titulo: string; resumo: string; corpo: string }>> {
  try {
    await requireAdmin();
    if (!process.env.OPENAI_API_KEY) return { ok: false, error: "OpenAI não configurado." };
    const t = (tema ?? "").trim();
    if (t.length < 3) return { ok: false, error: "Descreva o tema do artigo." };

    const area = especialidade && especialidade !== "geral" ? ` (área: ${especialidade})` : "";
    const prompt = `Você é um redator médico de um portal de ensino para MÉDICOS. Escreva um artigo/matéria sobre: "${t}"${area}.
Regras:
- Português do Brasil correto; tom técnico-didático e sóbrio (sem hype/marketing).
- Fiel à prática baseada em evidências. NÃO invente números/doses específicos dos quais não tenha certeza — nesses casos, oriente a confirmar na diretriz/protocolo.
- Corpo em HTML simples: <h2> para seções, <p>, <ul><li>, <strong>. Sem <html>/<head>/<style>. 4 a 8 parágrafos.
Retorne APENAS JSON: {"titulo":"...","resumo":"2-3 frases de resumo","corpo":"<h2>...</h2><p>...</p>..."}`;

    const r = await chatJSON<{ titulo?: string; resumo?: string; corpo?: string }>(prompt, {
      temperature: 0.4,
      maxTokens: 2600,
    });
    return { ok: true, data: { titulo: r.titulo ?? "", resumo: r.resumo ?? "", corpo: r.corpo ?? "" } };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
