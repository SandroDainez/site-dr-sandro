import OpenAI from "openai";

// Camada ÚNICA da integração OpenAI do MedCampus.
// Antes o client era instanciado inline (`new OpenAI(...)`) em 7 arquivos diferentes
// (ver docs/DIAGNOSTICO.md §7). Centralizado aqui para: reuso (Editora Médica e demais
// features), trocar config/modelo num lugar só, e não espalhar mais a integração.
// Memoizado por processo (o client é stateless e seguro de reutilizar).

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

// Modelos usados no projeto, num lugar só (facilita trocar/auditar).
export const AI_MODELS = {
  chat: "gpt-4o",
  chatMini: "gpt-4o-mini",
  search: "gpt-4o-search-preview",
  embed: "text-embedding-3-small",
} as const;

// Conveniência opcional: chat que devolve JSON já parseado. Não é obrigatório nos
// call sites atuais (que seguem chamando getOpenAI() direto) — existe para a Editora
// e novas features não reimplementarem o boilerplate de response_format + JSON.parse.
export async function chatJSON<T = unknown>(
  prompt: string,
  opts: { model?: string; temperature?: number; maxTokens?: number; system?: string } = {}
): Promise<T> {
  const messages: { role: "system" | "user"; content: string }[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: prompt });
  const r = await getOpenAI().chat.completions.create({
    model: opts.model ?? AI_MODELS.chat,
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 2000,
    response_format: { type: "json_object" },
  });
  return JSON.parse(r.choices[0].message.content ?? "{}") as T;
}
