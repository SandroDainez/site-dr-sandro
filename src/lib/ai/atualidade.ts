import { getDeepSeek, getOpenAI, deepseekModel, AI_MODELS } from "./openai";
import { aiProviders } from "./config";

// Caller do "Checar atualidade": recebe o prompt pronto (protocolo + fontes recentes) e
// devolve os itens desatualizados apontados pela IA. Usa o provider de GERAÇÃO (DeepSeek —
// contexto grande p/ caber as fontes recentes). O código depois enriquece com a fonte (url).

export type AtualidadeItem = {
  secao: string; trecho: string; problema: string; recomendacao_atual: string; pmid: string;
};

export async function checarAtualidade(args: { prompt: string }): Promise<{ itens: AtualidadeItem[] }> {
  const gen = aiProviders().generation;
  if (gen === "mock") return { itens: [] };
  const client = gen === "deepseek" ? getDeepSeek() : getOpenAI();
  const model = gen === "deepseek" ? deepseekModel() : AI_MODELS.chat;
  try {
    const r = await client.chat.completions.create({
      model, messages: [{ role: "user", content: args.prompt }], temperature: 0, max_tokens: 4000, response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(r.choices[0].message.content ?? "{}") as { itens?: unknown[] };
    const arr = Array.isArray(parsed.itens) ? parsed.itens : [];
    return {
      itens: arr
        .map((x) => x as Partial<AtualidadeItem>)
        .filter((x): x is AtualidadeItem => !!x && typeof x.trecho === "string" && x.trecho.trim().length > 0)
        .map((x) => ({
          secao: String(x.secao ?? ""), trecho: String(x.trecho ?? ""), problema: String(x.problema ?? ""),
          recomendacao_atual: String(x.recomendacao_atual ?? ""), pmid: String(x.pmid ?? ""),
        })),
    };
  } catch (e) {
    throw new Error(`Falha ao checar atualidade (${gen}/${model}): ${e instanceof Error ? e.message : String(e)}`);
  }
}
