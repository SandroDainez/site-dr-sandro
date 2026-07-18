import type OpenAI from "openai";
import { AI_MODELS } from "@/lib/ai/openai";
import { invariantesDisparados, type Invariante } from "./safety-invariants";

// AUDITOR de segurança (STEP 4 do pipeline: interpreter → retriever → writer → AUDITOR).
// Depois que o writer produz a resposta, verifica de forma DETERMINÍSTICA que as ressalvas
// consagradas (safety-invariants.ts) não foram OMITIDAS nem CONTRARIADAS quando o tema apareceu.
// Prompt sozinho obedece ~2/3 das vezes; o auditor fecha a lacuna: regenera 1x com a regra
// obrigatória e, se ainda faltar, ANEXA o texto canônico (garantia final).

type Veredito = "ok" | "faltando" | "contradiz" | "nao_aplica";

const CHECK_PROMPT = (pergunta: string, resposta: string, invs: Invariante[]) => `Você é um AUDITOR de segurança clínica. NÃO reescreva a resposta — apenas verifique se ela cumpre cada REGRA abaixo.

PERGUNTA DO USUÁRIO:
${pergunta}

RESPOSTA DO ASSISTENTE:
${resposta}

REGRAS A VERIFICAR:
${invs.map((i, n) => `${n + 1}. [${i.id}] ${i.exigencia}`).join("\n")}

Para CADA regra, classifique:
- "ok" = a resposta cumpre a regra (afirma o que ela exige).
- "faltando" = o tema é relevante mas a resposta OMITIU o ponto exigido.
- "contradiz" = a resposta afirma algo que CONTRARIA a regra (mais grave).
- "nao_aplica" = o tema da regra não é realmente o assunto desta resposta (gatilho por acaso).

Responda APENAS JSON: {"vereditos": [{"id": "<id>", "status": "ok|faltando|contradiz|nao_aplica"}]}`;

async function checar(
  openai: OpenAI,
  pergunta: string,
  resposta: string,
  invs: Invariante[],
): Promise<Map<string, Veredito>> {
  const out = new Map<string, Veredito>();
  try {
    const r = await openai.chat.completions.create({
      model: AI_MODELS.chatMini,
      temperature: 0,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: CHECK_PROMPT(pergunta, resposta, invs) }],
    });
    const p = JSON.parse(r.choices[0].message.content ?? "{}");
    for (const v of Array.isArray(p.vereditos) ? p.vereditos : []) {
      const st = v?.status;
      if (st === "ok" || st === "faltando" || st === "contradiz" || st === "nao_aplica") out.set(String(v.id), st);
    }
  } catch {
    // Falha do checador → não bloqueia (fail-open); a resposta segue como estava.
  }
  return out;
}

// Falhas que exigem ação = alta severidade + (faltando|contradiz).
function falhas(invs: Invariante[], vereditos: Map<string, Veredito>): Invariante[] {
  return invs.filter((i) => {
    const v = vereditos.get(i.id);
    return i.severidade === "alta" && (v === "faltando" || v === "contradiz");
  });
}

export type AuditResult = { resposta: string; regenerou: boolean; anexou: string[] };

// Aplica o auditor. `regenerar` é injetado pelo orchestrator (mesma chamada do writer, com
// instrução extra) para não acoplar o auditor ao pipeline. Retorna a resposta corrigida.
export async function auditarResposta(
  openai: OpenAI,
  pergunta: string,
  resposta: string,
  regenerar: (regras: Invariante[]) => Promise<string>,
): Promise<AuditResult> {
  const disparados = invariantesDisparados(pergunta, resposta);
  if (disparados.length === 0) return { resposta, regenerou: false, anexou: [] };

  const v1 = await checar(openai, pergunta, resposta, disparados);
  let falhando = falhas(disparados, v1);
  if (falhando.length === 0) return { resposta, regenerou: false, anexou: [] };

  // 1) Regenera UMA vez com as regras que falharam como obrigatórias.
  let texto = resposta;
  let regenerou = false;
  try {
    const nova = (await regenerar(falhando)).trim();
    if (nova) {
      texto = nova;
      regenerou = true;
      // Re-audita só as que falharam (o tema já é conhecido → checa direto, sem re-disparar gatilho).
      const v2 = await checar(openai, pergunta, texto, falhando);
      falhando = falhas(falhando, v2);
    }
  } catch {
    // Regeneração falhou → cai no backstop de anexar.
  }

  // 2) Backstop determinístico: o que AINDA faltar, anexa o texto canônico (garantia).
  const anexou: string[] = [];
  if (falhando.length > 0) {
    const blocos = falhando.map((i) => `- ${i.canonico}`).join("\n");
    texto = `${texto.trimEnd()}\n\n**⚠️ Ressalvas de segurança (não podem faltar):**\n${blocos}`;
    anexou.push(...falhando.map((i) => i.id));
  }

  return { resposta: texto, regenerou, anexou };
}
