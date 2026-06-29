import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUsuario } from "@/lib/supabase/auth-server";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { handleMedicalQuery } from "@/lib/assistente/orchestrator";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Exclusivo para usuários logados (controla custo + é benefício de membro).
  const user = await getUsuario();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para usar o assistente." }, { status: 401 });
  if (!serviceConfigured() || !process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Assistente indisponível." }, { status: 503 });

  let pergunta = "";
  try { pergunta = String((await request.json()).pergunta || "").trim(); } catch {}
  if (pergunta.length < 3) return NextResponse.json({ error: "Escreva sua pergunta." }, { status: 400 });

  const supabase = createServiceClient();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // Pipeline: biblioteca interna (RAG) → PubMed (se preciso) → gpt-4o → guardrails.
    const { resposta, fontes } = await handleMedicalQuery(supabase, openai, pergunta);
    return NextResponse.json({ resposta, fontes });
  } catch {
    return NextResponse.json({ error: "Falha ao consultar o assistente. Tente de novo." }, { status: 502 });
  }
}
