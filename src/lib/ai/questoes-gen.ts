import type OpenAI from "openai";
import { getOpenAI, getDeepSeek, deepseekModel, openaiReviewModel, AI_MODELS } from "./openai";
import { aiProviders } from "./config";
import type { Source, Issue } from "./types";
import type { QuestaoGerada } from "@/lib/editora/questao-estrutura";
import { buildCriadorQuestoesPrompt } from "./prompts/criador-questoes";
import { buildRevisaoQuestoesPrompt } from "./prompts/revisao-questoes";

// Geração/revisão do MCQ. A forma da saída (enunciado/opções/gabarito/justificativa) não é
// o {secoes:[...]} do núcleo, então este módulo faz as chamadas diretamente pelos clients de
// src/lib/ai/openai.ts (DeepSeek na geração, GPT-4o na revisão), com fallback mock. A validação
// de citações continua sendo feita pelo CÓDIGO (citations.ts) sobre a justificativa.

type Usage = { tokensIn: number; tokensOut: number };
function usageDe(u: OpenAI.Completions.CompletionUsage | undefined): Usage {
  return { tokensIn: u?.prompt_tokens ?? 0, tokensOut: u?.completion_tokens ?? 0 };
}

function normQuestoes(raw: unknown): QuestaoGerada[] {
  const arr = Array.isArray((raw as { questoes?: unknown[] })?.questoes) ? (raw as { questoes: unknown[] }).questoes : [];
  return arr.map((q) => {
    const o = q as Partial<QuestaoGerada>;
    return {
      enunciado: String(o.enunciado ?? ""),
      opcoes: Array.isArray(o.opcoes) ? o.opcoes.map((x) => String(x)) : [],
      correta: Number.isInteger(o.correta) ? (o.correta as number) : 0,
      justificativa: Array.isArray(o.justificativa) ? o.justificativa : [],
    };
  }).filter((q) => q.enunciado && q.opcoes.length >= 2);
}

// ── MOCK (dev sem chave) — questões determinísticas com citação válida na 1ª fonte ──
function mockQuestoes(quantidade: number, sources: Source[]): QuestaoGerada[] {
  const s = sources[0];
  const ancora = s ? s.texto.split(/\s+/).slice(0, 8).join(" ") : null;
  return Array.from({ length: quantidade }, (_, i) => ({
    enunciado: `(mock) Questão ${i + 1} sobre o material fornecido?`,
    opcoes: ["Alternativa A (correta)", "Alternativa B", "Alternativa C", "Alternativa D"],
    correta: 0,
    justificativa: [{ texto: "Justificativa fundamentada na referência.", source_id: s?.id ?? null, ancora, tipo: "clinica" as const }],
  }));
}

export async function gerarQuestoesIA(args: {
  especialidade?: string; nivel?: string; quantidade: number; sources: Source[];
}): Promise<{ questoes: QuestaoGerada[]; usage: Usage; provider: string; model: string }> {
  const gen = aiProviders().generation; // "deepseek" | "openai" | "mock"
  if (gen === "mock") {
    return { questoes: mockQuestoes(args.quantidade, args.sources), usage: { tokensIn: 0, tokensOut: 0 }, provider: "mock", model: "mock" };
  }
  const client = gen === "deepseek" ? getDeepSeek() : getOpenAI();
  const model = gen === "deepseek" ? deepseekModel() : AI_MODELS.chat;
  const prompt = buildCriadorQuestoesPrompt(args);
  try {
    const r = await client.chat.completions.create({
      model, messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 4000, response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(r.choices[0].message.content ?? "{}");
    return { questoes: normQuestoes(parsed), usage: usageDe(r.usage), provider: gen, model };
  } catch (e) {
    throw new Error(`Falha na geração de questões (${gen}/${model}): ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function revisarQuestoesIA(args: {
  questoes: QuestaoGerada[]; sources: Source[];
}): Promise<{ issues: Issue[]; corrigido: QuestaoGerada[]; usage: Usage; provider: string; model: string }> {
  const rev = aiProviders().review; // "openai" | "mock"
  if (rev === "mock") {
    return { issues: [], corrigido: args.questoes, usage: { tokensIn: 0, tokensOut: 0 }, provider: "mock", model: "mock" };
  }
  const client = getOpenAI();
  const model = openaiReviewModel();
  const prompt = buildRevisaoQuestoesPrompt(args);
  try {
    const r = await client.chat.completions.create({
      model, messages: [{ role: "user", content: prompt }], temperature: 0, max_tokens: 4000, response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(r.choices[0].message.content ?? "{}");
    const issues: Issue[] = Array.isArray(parsed.issues) ? parsed.issues : [];
    const corrigido = normQuestoes(parsed.corrigido ?? {});
    return { issues, corrigido: corrigido.length ? corrigido : args.questoes, usage: usageDe(r.usage), provider: "openai", model };
  } catch (e) {
    throw new Error(`Falha na revisão de questões (openai/${model}): ${e instanceof Error ? e.message : String(e)}`);
  }
}
