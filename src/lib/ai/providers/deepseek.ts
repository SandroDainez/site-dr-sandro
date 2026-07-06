import { getDeepSeek, deepseekModel } from "../openai";
import { gerarSecoes } from "./shared";
import type { AIProvider, GenerateInput, GenerateResult, ReviewResult } from "../types";

// DeepSeekProvider — ESTÁGIO 1 (geração) do pipeline. API compatível com OpenAI (mesmo
// SDK, baseURL própria). Key só server-side (DEEPSEEK_API_KEY). Modelo por DEEPSEEK_MODEL
// (default deepseek-chat). Ver src/lib/ai/openai.ts (getDeepSeek).
export class DeepSeekProvider implements AIProvider {
  readonly nome = "deepseek";

  async generate(input: GenerateInput): Promise<GenerateResult> {
    return gerarSecoes(getDeepSeek(), input.model ?? deepseekModel(), this.nome, input);
  }

  // No pipeline, a REVISÃO é sempre GPT-4o (OpenAIProvider). DeepSeek não revisa.
  async review(): Promise<ReviewResult> {
    throw new Error("DeepSeekProvider não faz revisão — o estágio de revisão usa OpenAI (GPT-4o).");
  }
}
