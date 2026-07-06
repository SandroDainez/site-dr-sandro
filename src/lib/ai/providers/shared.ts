import type OpenAI from "openai";
import type { GenerateInput, GenerateResult, ReviewInput, ReviewResult, SecaoGerada, Issue } from "../types";
import { buildRevisaoPrompt } from "../prompts/revisao";

// Lógica compartilhada por OpenAIProvider e DeepSeekProvider (a API do DeepSeek é
// compatível com a da OpenAI, então o mesmo código serve para os dois clients).

function usageDe(u: OpenAI.Completions.CompletionUsage | undefined) {
  return { tokensIn: u?.prompt_tokens ?? 0, tokensOut: u?.completion_tokens ?? 0 };
}

// Estágio 1 — geração de um bloco (recebe o prompt já montado em input.prompt).
export async function gerarSecoes(client: OpenAI, model: string, providerName: string, input: GenerateInput): Promise<GenerateResult> {
  const prompt = input.prompt ?? "";
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: input.temperature ?? 0.2,
      max_tokens: input.maxTokens ?? 3500,
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(r.choices[0].message.content ?? "{}");
    const secoes: SecaoGerada[] = Array.isArray(parsed.secoes) ? parsed.secoes : [];
    return { provider: providerName, model, secoes, usage: usageDe(r.usage) };
  } catch (e) {
    throw new Error(`Falha na geração (${providerName}/${model}): ${e instanceof Error ? e.message : String(e)}`);
  }
}

// Estágio 2 — revisão do protocolo montado. NÃO reescreve em silêncio: devolve
// APONTAMENTOS (issues) + versão corrigida à parte.
export async function revisarProtocolo(client: OpenAI, model: string, providerName: string, input: ReviewInput): Promise<ReviewResult> {
  const prompt = buildRevisaoPrompt(input.modulo, { secoes: input.draft.secoes, sources: input.sources });
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(r.choices[0].message.content ?? "{}");
    const issues: Issue[] = Array.isArray(parsed.issues) ? parsed.issues : [];
    const corrigidoSecoes: SecaoGerada[] = Array.isArray(parsed.corrigido?.secoes) ? parsed.corrigido.secoes : input.draft.secoes;
    return {
      provider: providerName,
      model,
      issues,
      corrigido: { provider: providerName, model, secoes: corrigidoSecoes, usage: { tokensIn: 0, tokensOut: 0 } },
      confidence: 0, // o confidence "de verdade" é calculado pelo CÓDIGO (citations.ts), não aqui
      usage: usageDe(r.usage),
    };
  } catch (e) {
    throw new Error(`Falha na revisão (${providerName}/${model}): ${e instanceof Error ? e.message : String(e)}`);
  }
}
