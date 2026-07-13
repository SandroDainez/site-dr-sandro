import type { Source, SecaoGerada } from "../types";

// Prompt do ESTÁGIO 2 (revisão, GPT-4o) do Atualizador de Protocolos. Versionado.
// Confere que cada mudança proposta tem respaldo REAL nas evidências. Aponta + corrige.

export const REVISAO_ATUALIZACAO_PROMPT_VERSION = "1.1.0";

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildRevisaoAtualizacaoPrompt(args: { secoes: SecaoGerada[]; sources: Source[] }): string {
  const { secoes, sources } = args;
  return `Você é um REVISOR SÊNIOR de medicina baseada em evidências. Recebe um RELATÓRIO DE
ATUALIZAÇÃO de protocolo (JSON) e as EVIDÊNCIAS recuperadas. NÃO reescreva em silêncio: aponte
cada problema E devolva uma versão corrigida à parte.

VERIFIQUE:
0. COERÊNCIA DE TEMA (crítico): sinalize como severidade ALTA (tipo "off_topic") qualquer trecho, afirmação ou item que seja de OUTRO tema, doença ou especialidade que não o assunto central deste conteúdo — mesmo bem escrito e citado. Aponte o trecho exato e sugira REMOVER (não pertence aqui).
1. Cada "novidade"/"mudança" proposta está REALMENTE sustentada por uma evidência da lista (não superinterpretada).
2. Cada citação (source_id) aponta para uma EVIDÊNCIA REAL e a âncora consta no texto dela.
3. Números/doses transcritos fielmente; sinalize divergências.
4. Extrapolações (afirmação além do que a evidência diz) — sinalize como extrapolação (severidade alta).
Se o relatório afirma novidade que a evidência não sustenta, é um problema grave.

EVIDÊNCIAS:
${sourcesToText(sources)}

RELATÓRIO (JSON):
${JSON.stringify({ secoes }, null, 2)}

Retorne APENAS JSON:
{"issues":[{"ref":"<seção>","tipo":"off_topic|citacao_invalida|sem_fonte|impreciso|dose_suspeita|estilo","severidade":"alta|media|baixa","descricao":"<o que está errado>","sugestao":"<como corrigir>"}],
 "corrigido":{"secoes":[{"secao":"<nome>","afirmacoes":[{"texto":"...","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}}`;
}
