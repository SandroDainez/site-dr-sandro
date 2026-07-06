import { BLOCO_ANTI_ALUCINACAO } from "./anti-alucinacao";
import type { Source, SecaoGerada } from "../types";

// Prompt do módulo "Arquiteto de Protocolos" (versionado). O MockProvider não usa
// este prompt — ele existe para os providers reais (Comando 7.5). Ver ARQUITETURA-IA §3.

export const ARQUITETO_PROTOCOLOS_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources
    .map((s) => `[${s.id}] (${s.tipo}${s.autor ? `, ${s.autor}` : ""}${s.ano ? `, ${s.ano}` : ""}) ${s.titulo}\n${s.texto}`)
    .join("\n\n---\n\n");
}

function secoesToText(secs: SecaoGerada[]): string {
  if (!secs.length) return "(nenhuma seção gerada ainda)";
  return secs
    .map((s) => `## ${s.secao}\n` + s.afirmacoes.map((a) => `- ${a.texto} [${a.source_id ?? "sem fonte"}]`).join("\n"))
    .join("\n\n");
}

// Monta o prompt de UM bloco: bloco anti-alucinação + instruções do módulo +
// sources completos + seções já geradas (contexto) + seções-alvo deste bloco.
export function buildArquitetoProtocolosPrompt(args: {
  especialidade?: string;
  sources: Source[];
  secoesAlvo: string[];
  secoesAnteriores: SecaoGerada[];
}): string {
  const { especialidade, sources, secoesAlvo, secoesAnteriores } = args;
  return `Você é um ARQUITETO DE PROTOCOLOS clínicos institucionais${especialidade ? ` (área: ${especialidade})` : ""}.
Sua tarefa: redigir APENAS as seções deste bloco de um protocolo, na estrutura fixa institucional.

${BLOCO_ANTI_ALUCINACAO}

SOURCES (material fornecido — use SÓ isto):
${sourcesToText(sources)}

SEÇÕES JÁ GERADAS (contexto — não repita, mantenha coerência):
${secoesToText(secoesAnteriores)}

GERE AGORA, e SOMENTE, estas seções (nesta ordem), no formato JSON especificado:
${secoesAlvo.map((s) => `- ${s}`).join("\n")}`;
}
