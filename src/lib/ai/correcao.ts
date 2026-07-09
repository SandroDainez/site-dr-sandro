import type OpenAI from "openai";
import { getOpenAI, getDeepSeek, deepseekModel, AI_MODELS } from "./openai";
import { aiProviders } from "./config";
import type { Source } from "./types";
import type { ItemCorrigir } from "./prompts/correcao-protocolos";

// "Aplicar correções da IA": reancora as afirmações reprovadas na validação. Usa o provider
// de GERAÇÃO (DeepSeek — contexto grande, sem o gargalo de TPM do gpt-4o). O CÓDIGO revalida
// depois (citations.ts), então uma âncora inventada aqui simplesmente não conta.
//
// GENÉRICO: recebe o PROMPT já construído (cada módulo tem seu próprio builder — ver
// prompts/correcao-protocolos.ts como referência) para poder adaptar o wording ao tipo de
// conteúdo (protocolo, aula, texto científico, etc.) sem duplicar a lógica de chamada/parse.

export type Correcao = { id: string; texto?: string; source_id: string | null; ancora: string | null; tipo?: "clinica" | "dose" | "geral" };
type Usage = { tokensIn: number; tokensOut: number };
function usageDe(u: OpenAI.Completions.CompletionUsage | undefined): Usage {
  return { tokensIn: u?.prompt_tokens ?? 0, tokensOut: u?.completion_tokens ?? 0 };
}

function normCorrecoes(raw: unknown): Correcao[] {
  const arr = Array.isArray((raw as { correcoes?: unknown[] })?.correcoes) ? (raw as { correcoes: unknown[] }).correcoes : [];
  return arr
    .map((c) => {
      const o = c as Partial<Correcao>;
      if (!o.id) return null;
      const tipo = o.tipo === "clinica" || o.tipo === "dose" || o.tipo === "geral" ? o.tipo : undefined;
      return {
        id: String(o.id),
        texto: typeof o.texto === "string" ? o.texto : undefined,
        source_id: o.source_id ? String(o.source_id) : null,
        ancora: o.ancora ? String(o.ancora) : null,
        tipo,
      } as Correcao;
    })
    .filter((c): c is Correcao => c !== null);
}

// MOCK (dev sem chave): ancora cada item no início da 1ª fonte — vira citação válida.
function mockCorrecoes(itens: ItemCorrigir[], sources: Source[]): Correcao[] {
  const s = sources[0];
  const ancora = s ? s.texto.split(/\s+/).slice(0, 8).join(" ") : null;
  return itens.map((i) => ({ id: i.id, source_id: s?.id ?? null, ancora: s ? ancora : null, tipo: (i.tipo as Correcao["tipo"]) ?? "clinica" }));
}

export async function corrigirCitacoes(args: { itens: ItemCorrigir[]; sources: Source[]; prompt: string }): Promise<{ correcoes: Correcao[]; usage: Usage; provider: string; model: string }> {
  if (args.itens.length === 0) return { correcoes: [], usage: { tokensIn: 0, tokensOut: 0 }, provider: "-", model: "-" };
  const gen = aiProviders().generation; // "deepseek" | "openai" | "mock"
  if (gen === "mock") {
    return { correcoes: mockCorrecoes(args.itens, args.sources), usage: { tokensIn: 0, tokensOut: 0 }, provider: "mock", model: "mock" };
  }
  const client = gen === "deepseek" ? getDeepSeek() : getOpenAI();
  const model = gen === "deepseek" ? deepseekModel() : AI_MODELS.chat;
  const prompt = args.prompt;
  try {
    const r = await client.chat.completions.create({
      model, messages: [{ role: "user", content: prompt }], temperature: 0, max_tokens: 6000, response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(r.choices[0].message.content ?? "{}");
    return { correcoes: normCorrecoes(parsed), usage: usageDe(r.usage), provider: gen, model };
  } catch (e) {
    throw new Error(`Falha ao aplicar correções (${gen}/${model}): ${e instanceof Error ? e.message : String(e)}`);
  }
}
