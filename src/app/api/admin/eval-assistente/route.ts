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

  let somenteSentinelas = false;
  try { somenteSentinelas = !!(await req.json())?.somenteSentinelas; } catch {}
  const banco = somenteSentinelas ? EVAL_SENTINELAS : EVAL_QUESTOES;

  const supabase = createServiceClient();
  const openai = getOpenAI();
  const resultados: Nota[] = [];

  for (const q of banco) {
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

  const n = resultados.length || 1;
  const media = (k: (r: Nota) => number) => Math.round(resultados.reduce((s, r) => s + k(r), 0) / n);
  const resumo = {
    total: resultados.length,
    aprovadas: resultados.filter((r) => r.aprovado).length,
    errosGraves: resultados.filter((r) => r.erroGrave).length,
    dosesErradas: resultados.filter((r) => r.doseOk === false).length,
    correcao: media((r) => r.correcao),
    cobertura: media((r) => r.cobertura),
    fidelidade: media((r) => r.fidelidade),
    citouFonte: resultados.filter((r) => r.citouFonte).length,
  };

  return NextResponse.json({ resumo, resultados });
}
