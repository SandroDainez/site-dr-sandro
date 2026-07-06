import type { Source, SecaoGerada } from "../types";

// Prompt do ESTÁGIO 2 (revisão, GPT-4o) do Comparador de Guidelines. Versionado.
// Confere que cada posição atribuída a uma fonte é REAL (não trocada/inventada). Aponta + corrige.

export const REVISAO_COMPARADOR_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildRevisaoComparadorPrompt(args: { secoes: SecaoGerada[]; sources: Source[] }): string {
  const { secoes, sources } = args;
  return `Você é um REVISOR SÊNIOR de medicina baseada em evidências. Recebe uma COMPARAÇÃO de
diretrizes (JSON: cada "secao" é um aspecto; cada afirmação é a posição de uma fonte) e as
EVIDÊNCIAS. NÃO reescreva em silêncio: aponte cada problema E devolva versão corrigida à parte.

VERIFIQUE:
1. A posição atribuída a cada fonte REALMENTE consta na evidência daquela fonte (não trocar fontes, não inventar posição).
2. Cada citação (source_id) aponta para uma EVIDÊNCIA REAL e a âncora consta no texto dela.
3. Concordâncias/divergências descritas são fiéis (não exagerar divergência inexistente).
4. Doses/números transcritos fielmente; extrapolações sinalizadas (severidade alta).

EVIDÊNCIAS:
${sourcesToText(sources)}

COMPARAÇÃO (JSON):
${JSON.stringify({ secoes }, null, 2)}

Retorne APENAS JSON:
{"issues":[{"ref":"<aspecto>","tipo":"citacao_invalida|sem_fonte|impreciso|dose_suspeita|estilo","severidade":"alta|media|baixa","descricao":"<o que está errado>","sugestao":"<como corrigir>"}],
 "corrigido":{"secoes":[{"secao":"<aspecto>","afirmacoes":[{"texto":"...","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}}`;
}
