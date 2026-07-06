import { getOpenAI, AI_MODELS, openaiReviewModel } from "../openai";
import { gerarSecoes, revisarProtocolo } from "./shared";
import type { AIProvider, GenerateInput, GenerateResult, ReviewInput, ReviewResult } from "../types";

// OpenAIProvider — REUTILIZA a integração existente (getOpenAI de src/lib/ai/openai.ts,
// env OPENAI_API_KEY). Usado como ESTÁGIO 2 (revisão / auditor) do pipeline; também pode
// gerar (fallback). Modelo de revisão configurável por OPENAI_REVIEW_MODEL (default gpt-4o).
export class OpenAIProvider implements AIProvider {
  readonly nome = "openai";

  async generate(input: GenerateInput): Promise<GenerateResult> {
    return gerarSecoes(getOpenAI(), input.model ?? AI_MODELS.chat, this.nome, input);
  }

  async review(input: ReviewInput): Promise<ReviewResult> {
    return revisarProtocolo(getOpenAI(), openaiReviewModel(), this.nome, input);
  }
}
