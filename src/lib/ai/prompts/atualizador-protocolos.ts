import { BLOCO_ANTI_ALUCINACAO } from "./anti-alucinacao";
import type { Source } from "../types";

// Prompt do módulo "Atualizador de Protocolos" (versionado). Recebe o PROTOCOLO ATUAL +
// EVIDÊNCIAS recuperadas (biblioteca interna + PubMed) e produz um relatório de ATUALIZAÇÃO
// (delta) citado. Mesmo núcleo anti-alucinação + formato estruturado. Ver ARQUITETURA-IA §2.

export const ATUALIZADOR_PROTOCOLOS_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources
    .map((s) => `[${s.id}] (${s.tipo}${s.autor ? `, ${s.autor}` : ""}${s.ano ? `, ${s.ano}` : ""}) ${s.titulo}\n${s.texto}`)
    .join("\n\n---\n\n");
}

export function buildAtualizadorPrompt(args: {
  especialidade?: string;
  protocoloTitulo: string;
  protocoloTexto: string;
  evidencias: Source[];
  secoesAlvo: string[];
}): string {
  const { especialidade, protocoloTitulo, protocoloTexto, evidencias, secoesAlvo } = args;
  return `Você é um REVISOR DE PROTOCOLOS clínicos${especialidade ? ` (área: ${especialidade})` : ""}.
Sua tarefa: comparar o PROTOCOLO ATUAL com as EVIDÊNCIAS recuperadas e escrever um RELATÓRIO DE
ATUALIZAÇÃO (o "delta"), em português do Brasil. Diga o que é novo, o que reforça a conduta atual,
o que sugere mudança e o que é controverso — SEM reescrever o protocolo inteiro.

${BLOCO_ANTI_ALUCINACAO}

REGRAS DO RELATÓRIO:
- Baseie CADA ponto SOMENTE nas EVIDÊNCIAS abaixo (biblioteca interna + PubMed). Não use conhecimento externo.
- Cada afirmação clínica/dose cita a evidência que a sustenta (source_id + âncora verbatim). Sem respaldo → "sem fonte".
- Se as evidências NÃO trouxerem novidade real frente ao protocolo, diga isso explicitamente (não invente mudança).
- Seja específico: aponte a seção/conduta do protocolo afetada.

PROTOCOLO ATUAL — "${protocoloTitulo}":
${protocoloTexto || "(sem conteúdo)"}

EVIDÊNCIAS RECUPERADAS (use SÓ isto):
${sourcesToText(evidencias)}

GERE AGORA, e SOMENTE, estas seções (nesta ordem), no formato JSON especificado:
${secoesAlvo.map((s) => `- ${s}`).join("\n")}`;
}
