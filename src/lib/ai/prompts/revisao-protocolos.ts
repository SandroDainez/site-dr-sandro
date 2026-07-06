import type { Source, SecaoGerada } from "../types";

// Prompt do ESTÁGIO 2 (revisão, GPT-4o) do Arquiteto de Protocolos. Versionado.
// A revisão APONTA problemas e produz versão corrigida — NUNCA reescreve em silêncio.

export const REVISAO_PROTOCOLOS_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildRevisaoProtocolosPrompt(args: { secoes: SecaoGerada[]; sources: Source[] }): string {
  const { secoes, sources } = args;
  return `Você é um REVISOR SÊNIOR (nível editor de revista médica) de um protocolo clínico institucional.
Recebe o protocolo COMPLETO (em JSON estruturado) e os SOURCES originais. NÃO reescreva em silêncio:
aponte cada problema E devolva uma versão corrigida à parte.

VERIFIQUE:
1. Consistência entre as seções (contradições, repetições, ordem lógica).
2. Cada citação (source_id) aponta para um SOURCE REAL da lista, e a âncora consta no texto do source.
3. Doses e medicamentos foram TRANSCRITOS FIELMENTE dos sources (número, unidade, via, intervalo) — sinalize divergências.
4. Afirmações que EXTRAPOLAM os sources (conclusão sem respaldo) — sinalize como extrapolação.
Não invente conteúdo novo: se algo não está nos sources, a correção é marcar "sem fonte", não preencher.

SOURCES:
${sourcesToText(sources)}

PROTOCOLO (JSON):
${JSON.stringify({ secoes }, null, 2)}

Retorne APENAS JSON:
{"issues":[{"ref":"<seção ou trecho>","tipo":"citacao_invalida|sem_fonte|impreciso|dose_suspeita|estilo","severidade":"alta|media|baixa","descricao":"<o que está errado>","sugestao":"<como corrigir>"}],
 "corrigido":{"secoes":[{"secao":"<nome>","afirmacoes":[{"texto":"...","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}}`;
}
