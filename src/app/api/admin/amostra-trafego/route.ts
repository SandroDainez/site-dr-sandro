import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/ai/openai";
import { handleMedicalQuery } from "@/lib/assistente/orchestrator";
import { auditarRespostaReal, type NotaReal } from "@/lib/ai/eval/auditor-real";

// AMOSTRAGEM DE TRÁFEGO REAL: pega as perguntas REAIS dos usuários (assistant_queries),
// roda cada uma no assistente de HOJE e passa por um juiz SEM gabarito (auditor-real) para
// destacar as respostas arriscadas p/ o médico ler. É a "prova de vida real": mede o assistente
// na distribuição de perguntas que ele realmente recebe, não só no banco curado do eval.
// Admin only. Em lotes (o cliente chama de N em N) p/ não estourar a função serverless.
export const maxDuration = 300;

// Puxa a lista ORDENADA e DEDUPLICADA de perguntas reais recentes (determinística entre lotes).
async function listarPerguntas(sb: ReturnType<typeof createServiceClient>, dias: number): Promise<string[]> {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await sb
    .from("assistant_queries")
    .select("pergunta, created_at")
    .gte("created_at", desde)
    .order("created_at", { ascending: false })
    .limit(500);
  const vistas = new Set<string>();
  const perguntas: string[] = [];
  for (const row of (data ?? []) as { pergunta: string | null }[]) {
    const p = (row.pergunta ?? "").trim();
    if (p.length < 3) continue;
    const chave = p.toLowerCase();
    if (vistas.has(chave)) continue;
    vistas.add(chave);
    perguntas.push(p);
  }
  return perguntas;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!serviceConfigured() || !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Assistente/OpenAI indisponível." }, { status: 503 });
  }

  let dias = 30, offset = 0, limit = 5;
  try {
    const b = await req.json();
    if (Number.isFinite(b?.dias)) dias = Math.max(1, Math.min(365, Math.floor(b.dias)));
    if (Number.isFinite(b?.offset)) offset = Math.max(0, Math.floor(b.offset));
    if (Number.isFinite(b?.limit)) limit = Math.max(1, Math.min(20, Math.floor(b.limit)));
  } catch {}

  const supabase = createServiceClient();
  const todas = await listarPerguntas(supabase, dias);
  const lote = todas.slice(offset, offset + limit);
  const openai = getOpenAI();
  const resultados: NotaReal[] = [];

  for (const pergunta of lote) {
    try {
      const { resposta, fontes } = await handleMedicalQuery(supabase, openai, pergunta);
      const fontesTxt = Array.isArray(fontes)
        ? fontes.map((f) => (typeof f === "string" ? f : (f as { titulo?: string }).titulo ?? "")).filter(Boolean).join("; ")
        : "";
      resultados.push(await auditarRespostaReal(pergunta, resposta ?? "", fontesTxt));
    } catch (e) {
      resultados.push({
        pergunta, resposta: "", fontes: "", fidelidade: 0, semFonte: true,
        risco: "atencao", problemas: [], comentario: `Falha ao rodar: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  return NextResponse.json({ resultados, total: todas.length, offset, limit });
}
