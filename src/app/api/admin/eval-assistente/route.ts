import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/ai/openai";
import { handleMedicalQuery } from "@/lib/assistente/orchestrator";
import { EVAL_QUESTOES, EVAL_SENTINELAS } from "@/lib/ai/eval/questions";
import { avaliarResposta, type Nota } from "@/lib/ai/eval/grader";

// Roda a "prova" do assistente: cada questão do banco → pergunta ao assistente (mesmo pipeline
// real: biblioteca → PubMed → LLM → guardrails) → juiz-IA compara com o gabarito → placar.
// Admin only. Sequencial (custo/rate-limit); pode demorar ~1-2 min.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!serviceConfigured() || !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Assistente/OpenAI indisponível." }, { status: 503 });
  }

  // Roda em LOTES (o cliente chama de N em N) para não estourar o tempo da função serverless.
  let somenteSentinelas = false, offset = 0, limit = 100;
  try {
    const b = await req.json();
    somenteSentinelas = !!b?.somenteSentinelas;
    if (Number.isFinite(b?.offset)) offset = Math.max(0, Math.floor(b.offset));
    if (Number.isFinite(b?.limit)) limit = Math.max(1, Math.min(100, Math.floor(b.limit)));
  } catch {}
  const base = somenteSentinelas ? EVAL_SENTINELAS : EVAL_QUESTOES;
  const lote = base.slice(offset, offset + limit);

  const supabase = createServiceClient();
  const openai = getOpenAI();
  const resultados: Nota[] = [];

  for (const q of lote) {
    try {
      const { resposta, fontes } = await handleMedicalQuery(supabase, openai, q.pergunta);
      const fontesTxt = Array.isArray(fontes) ? fontes.map((f) => (typeof f === "string" ? f : (f as { titulo?: string }).titulo ?? "")).filter(Boolean).join("; ") : "";
      const nota = await avaliarResposta(openai, q, resposta ?? "", fontesTxt);
      resultados.push(nota);
    } catch (e) {
      resultados.push({
        id: q.id, tema: q.tema, risco: q.risco, correcao: 0, cobertura: 0, fidelidade: 0, doseOk: null,
        reconheceuIncerteza: false, citouFonte: false, erroGrave: false, erroGraveDesc: "",
        aprovado: false, comentario: `Falha ao rodar: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  // Devolve só o LOTE + o total do banco. O cliente acumula os lotes e monta o placar final.
  return NextResponse.json({ resultados, total: base.length, offset, limit });
}
