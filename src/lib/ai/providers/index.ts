import type { AIProvider } from "../types";
import { MockProvider } from "./mock";

// Registro de providers. Piloto: só "mock". OpenAIProvider e DeepSeekProvider entram
// no Comando 7.5 (OpenAI reutiliza src/lib/ai/openai.ts). AnthropicProvider: apenas
// PREVISTO — plugável aqui no futuro sem refatorar os módulos. Ver ARQUITETURA-IA §1.

export type ProviderName = "mock" | "openai" | "deepseek" | "anthropic";

const registro: Partial<Record<ProviderName, () => AIProvider>> = {
  mock: () => new MockProvider(),
  // openai:    () => new OpenAIProvider(),    // Comando 7.5
  // deepseek:  () => new DeepSeekProvider(),  // Comando 7.5
  // anthropic: () => new AnthropicProvider(), // previsto, sem implementação
};

export function getProvider(nome: ProviderName): AIProvider {
  const factory = registro[nome];
  if (!factory) throw new Error(`Provider de IA não disponível: ${nome}`);
  return factory();
}
