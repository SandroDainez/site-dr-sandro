import type { AIProvider } from "../types";
import { MockProvider } from "./mock";
import { OpenAIProvider } from "./openai";
import { DeepSeekProvider } from "./deepseek";

// Registro de providers. mock (dev/piloto) + reais openai/deepseek. AnthropicProvider:
// apenas PREVISTO — basta adicionar a factory aqui, sem refatorar os módulos.
export type ProviderName = "mock" | "openai" | "deepseek" | "anthropic";

const registro: Partial<Record<ProviderName, () => AIProvider>> = {
  mock: () => new MockProvider(),
  openai: () => new OpenAIProvider(),
  deepseek: () => new DeepSeekProvider(),
  // anthropic: () => new AnthropicProvider(), // previsto, sem implementação
};

export function getProvider(nome: ProviderName): AIProvider {
  const factory = registro[nome];
  if (!factory) throw new Error(`Provider de IA não disponível: ${nome}`);
  return factory();
}
