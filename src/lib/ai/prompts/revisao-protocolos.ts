import type { Source, SecaoGerada } from "../types";

// Prompt do ESTÁGIO 2 (revisão, GPT-4o) do Arquiteto de Protocolos. Versionado.
// A revisão só APONTA problemas (issues) com sugestão concreta — NÃO reescreve o documento.
// v2: removido o "corrigido" (documento inteiro reescrito) — não era aplicado (só ia pro log)
// e, com 33 seções, estourava o teto de tokens da saída (JSON truncado → "Falha na revisão").

export const REVISAO_PROTOCOLOS_PROMPT_VERSION = "2.0.0";

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildRevisaoProtocolosPrompt(args: { secoes: SecaoGerada[]; sources: Source[] }): string {
  const { secoes, sources } = args;
  return `Você é um REVISOR SÊNIOR (nível editor de revista médica) de um protocolo clínico institucional.
Recebe o protocolo COMPLETO (em JSON estruturado) e os SOURCES originais. Seu trabalho é APONTAR
problemas com sugestão concreta — NÃO reescreva o documento (a correção é aplicada manualmente).

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

Liste no máximo os ~25 apontamentos mais relevantes (priorize alta severidade). Retorne APENAS JSON:
{"issues":[{"ref":"<seção ou trecho>","tipo":"citacao_invalida|sem_fonte|impreciso|dose_suspeita|estilo","severidade":"alta|media|baixa","descricao":"<o que está errado>","sugestao":"<como corrigir>"}]}`;
}
