import type { Source, SecaoGerada } from "../types";

// Prompt do ESTÁGIO 2 (revisão, GPT-4o) do Pesquisador Científico. Versionado.
// Confere que cada afirmação da síntese tem respaldo REAL nas evidências. Aponta + corrige.

export const REVISAO_PESQUISADOR_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildRevisaoPesquisadorPrompt(args: { secoes: SecaoGerada[]; sources: Source[] }): string {
  const { secoes, sources } = args;
  return `Você é um REVISOR SÊNIOR de revisões de evidência. Recebe uma SÍNTESE de evidências (JSON)
e as EVIDÊNCIAS recuperadas. NÃO reescreva em silêncio: aponte cada problema E devolva versão corrigida.

VERIFIQUE:
1. Cada afirmação da síntese é REALMENTE sustentada por uma evidência da lista (sem superinterpretar/generalizar).
2. Cada citação (source_id) aponta para uma EVIDÊNCIA REAL e a âncora consta no texto dela.
3. Números/estatísticas/doses transcritos fielmente; sinalize divergências.
4. Conclusões prudentes (não afirmar mais do que a evidência sustenta) — extrapolação = severidade alta.

EVIDÊNCIAS:
${sourcesToText(sources)}

SÍNTESE (JSON):
${JSON.stringify({ secoes }, null, 2)}

Retorne APENAS JSON:
{"issues":[{"ref":"<seção>","tipo":"citacao_invalida|sem_fonte|impreciso|dose_suspeita|estilo","severidade":"alta|media|baixa","descricao":"<o que está errado>","sugestao":"<como corrigir>"}],
 "corrigido":{"secoes":[{"secao":"<nome>","afirmacoes":[{"texto":"...","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}}`;
}
