import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUsuario } from "@/lib/supabase/auth-server";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { embedUm, toVector } from "@/lib/agents/embeddings";
import { PRINCIPIOS_AGENTE } from "@/lib/agents/utils";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Exclusivo para usuários logados (controla custo + é benefício de membro).
  const user = await getUsuario();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para usar o assistente." }, { status: 401 });
  if (!serviceConfigured() || !process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Assistente indisponível." }, { status: 503 });

  let pergunta = "";
  try { pergunta = String((await request.json()).pergunta || "").trim(); } catch {}
  if (pergunta.length < 3) return NextResponse.json({ error: "Escreva sua pergunta." }, { status: 400 });

  // 1) Recupera os trechos mais relevantes do conteúdo do portal (RAG)
  const supabase = createServiceClient();
  let trechos: any[] = [];
  try {
    const vec = await embedUm(pergunta);
    const { data } = await supabase.rpc("match_kb", { query_embedding: toVector(vec), match_count: 8 });
    trechos = (data ?? []).filter((t: any) => t.similaridade > 0.2);
  } catch {
    trechos = [];
  }

  if (trechos.length === 0) {
    return NextResponse.json({
      resposta: "Não encontrei isso no conteúdo do portal. Conforme novos protocolos, boletins e materiais forem adicionados, eu passo a responder com base neles. Para uma decisão clínica agora, consulte uma fonte primária (diretriz da sociedade, UpToDate, PubMed).",
      fontes: [],
    });
  }

  // 2) Monta o contexto com rótulos numerados
  const contexto = trechos.map((t: any, i: number) => `[${i + 1}] (${t.fonte_tipo}${t.fonte_titulo ? ` — ${t.fonte_titulo}` : ""})\n${t.conteudo}`).join("\n\n");

  const prompt = `Você é um ASSISTENTE CLÍNICO do portal, para médicos especialistas (anestesiologia, terapia intensiva, emergência).

${PRINCIPIOS_AGENTE}

REGRAS DESTE ASSISTENTE:
- Responda USANDO SOMENTE o CONTEXTO abaixo (conteúdo curado do portal). NÃO use conhecimento externo como se fosse do portal.
- COBERTURA PARCIAL: se o contexto cobrir só parte da pergunta, RESPONDA a parte coberta (citando os trechos) e diga claramente o que NÃO está no portal. Não recuse a resposta inteira só porque falta um pedaço.
- Só responda exatamente "Não encontrei isso no conteúdo do portal." quando NENHUM trecho do contexto for relevante à pergunta.
- NUNCA invente dados, números ou recomendações que não estejam no contexto.
- Cite os trechos usados pelo número, ex.: [1], [3].
- Linguagem técnica de especialista. É APOIO À DECISÃO — nunca uma ordem; a palavra final é do médico.
- Mantenha o nível de evidência quando aparecer no contexto.

CONTEXTO:
${contexto}

PERGUNTA: ${pergunta}

Responda em português, objetivo e fundamentado.`;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let resposta = "";
  try {
    const r = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 900,
    });
    resposta = r.choices[0].message.content ?? "";
  } catch {
    return NextResponse.json({ error: "Falha ao consultar o assistente. Tente de novo." }, { status: 502 });
  }

  // 3) Fontes únicas (título + link) para a UI mostrar
  const vistas = new Set<string>();
  const fontes = trechos
    .map((t: any) => ({ titulo: t.fonte_titulo, url: t.fonte_url, tipo: t.fonte_tipo }))
    .filter((f: any) => f.titulo && !vistas.has(f.titulo) && vistas.add(f.titulo));

  return NextResponse.json({ resposta, fontes });
}
