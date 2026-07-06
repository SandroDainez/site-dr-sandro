import type { Source, SecaoGerada } from "../types";

// Prompt do ESTÁGIO 2 (revisão, GPT-4o) do Criador de Flashcards. Versionado.
// Cada "secao" é a FRENTE do cartão; suas "afirmacoes" são o VERSO. A revisão APONTA
// problemas e devolve versão corrigida — NUNCA reescreve em silêncio.

export const REVISAO_FLASHCARDS_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildRevisaoFlashcardsPrompt(args: { secoes: SecaoGerada[]; sources: Source[] }): string {
  const { secoes, sources } = args;
  return `Você é um REVISOR SÊNIOR de material de estudo médico. Recebe um conjunto de FLASHCARDS
(JSON: cada "secao" é a FRENTE/pergunta; suas "afirmacoes" são o VERSO/resposta) e as REFERÊNCIAS.
NÃO reescreva em silêncio: aponte cada problema E devolva uma versão corrigida à parte.

VERIFIQUE:
1. A frente (pergunta) é clara e a resposta no verso realmente responde à pergunta.
2. Cada citação (source_id) aponta para uma REFERÊNCIA REAL, e a âncora consta no texto dela.
3. Doses/números foram TRANSCRITOS FIELMENTE das referências — sinalize divergências.
4. Respostas que EXTRAPOLAM as referências (resposta "de memória") — sinalize.
Não invente conteúdo; o que não está nas referências é marcado "sem fonte".

REFERÊNCIAS:
${sourcesToText(sources)}

FLASHCARDS (JSON):
${JSON.stringify({ secoes }, null, 2)}

Retorne APENAS JSON:
{"issues":[{"ref":"<frente do cartão>","tipo":"citacao_invalida|sem_fonte|impreciso|dose_suspeita|estilo","severidade":"alta|media|baixa","descricao":"<o que está errado>","sugestao":"<como corrigir>"}],
 "corrigido":{"secoes":[{"secao":"<frente>","afirmacoes":[{"texto":"<verso>","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}}`;
}
