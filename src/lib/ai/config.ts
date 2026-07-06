import type { ProviderName } from "./providers";

// Seleção de providers por env var AI_PROVIDER (mock|real) — dev sem gastar créditos.
//  mock → geração e revisão simuladas (MockProvider).
//  real → ESTÁGIO 1 (geração) = DeepSeek; ESTÁGIO 2 (revisão) = OpenAI/GPT-4o.
export function aiMode(): "mock" | "real" {
  return (process.env.AI_PROVIDER || "mock").toLowerCase() === "real" ? "real" : "mock";
}

export function aiProviders(): { generation: ProviderName; review: ProviderName } {
  return aiMode() === "real"
    ? { generation: "deepseek", review: "openai" }
    : { generation: "mock", review: "mock" };
}
