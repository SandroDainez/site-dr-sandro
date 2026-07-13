import { getDeepSeek, getOpenAI, deepseekModel, AI_MODELS } from "./openai";
import { aiProviders } from "./config";
import type { ItemLimpar } from "./prompts/limpeza-protocolos";

// Classificador de remoção da "Limpeza": recebe o prompt pronto e devolve os ids a remover.
// Usa o provider de GERAÇÃO (DeepSeek). O código aplica a remoção depois — este passo só decide.
export type Remocao = { id: string; motivo: string };

export async function classificarRemocao(args: { itens: ItemLimpar[]; prompt: string }): Promise<{ remover: Remocao[] }> {
  if (args.itens.length === 0) return { remover: [] };
  const gen = aiProviders().generation;
  if (gen === "mock") return { remover: [] }; // dev sem chave: não remove nada
  const client = gen === "deepseek" ? getDeepSeek() : getOpenAI();
  const model = gen === "deepseek" ? deepseekModel() : AI_MODELS.chat;
  try {
    const r = await client.chat.completions.create({
      model, messages: [{ role: "user", content: args.prompt }], temperature: 0, max_tokens: 3000, response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(r.choices[0].message.content ?? "{}") as { remover?: unknown[] };
    const arr = Array.isArray(parsed.remover) ? parsed.remover : [];
    return {
      remover: arr
        .map((x) => x as Partial<Remocao>)
        .filter((x): x is Remocao => !!x && typeof x.id === "string")
        .map((x) => ({ id: String(x.id), motivo: String(x.motivo ?? "") })),
    };
  } catch (e) {
    throw new Error(`Falha na limpeza (${gen}/${model}): ${e instanceof Error ? e.message : String(e)}`);
  }
}
