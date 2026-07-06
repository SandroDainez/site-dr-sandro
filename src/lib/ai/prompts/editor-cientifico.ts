import { BLOCO_ANTI_ALUCINACAO } from "./anti-alucinacao";
import type { Source, SecaoGerada } from "../types";

// Prompt do módulo "Editor Científico" (versionado). Geração de texto científico para
// MÉDICOS a partir das REFERÊNCIAS fornecidas (sources). Mesmo núcleo anti-alucinação +
// formato estruturado (afirmações com source_id + âncora) do Arquiteto. Ver ARQUITETURA-IA §3.

export const EDITOR_CIENTIFICO_PROMPT_VERSION = "1.0.0";

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

// Monta o prompt de UM bloco: bloco anti-alucinação + instruções do módulo + sources
// completos + seções já geradas (contexto) + seções-alvo deste bloco.
export function buildEditorCientificoPrompt(args: {
  especialidade?: string;
  sources: Source[];
  secoesAlvo: string[];
  secoesAnteriores: SecaoGerada[];
}): string {
  const { especialidade, sources, secoesAlvo, secoesAnteriores } = args;
  return `Você é um EDITOR CIENTÍFICO médico${especialidade ? ` (área: ${especialidade})` : ""}, escrevendo para um público de MÉDICOS.
Sua tarefa: redigir APENAS as seções deste bloco de um texto científico, em português do Brasil, com tom técnico-acadêmico, sóbrio e preciso (sem marketing/hype). Cada afirmação relevante deve estar ancorada nas REFERÊNCIAS fornecidas.

${BLOCO_ANTI_ALUCINACAO}

DIRETRIZES DE REDAÇÃO CIENTÍFICA:
- "Título": um título objetivo e informativo (tipo "geral", sem exigir fonte).
- "Resumo": síntese estruturada do que as referências sustentam (2-4 afirmações).
- Fundamente números, estatísticas e desfechos SEMPRE numa referência (tipo "clinica" ou "dose"), transcrevendo o dado fielmente na âncora.
- Não extrapole além do que as referências dizem; lacunas viram "sem fonte" (source_id: null), nunca afirmação inventada.

REFERÊNCIAS (material fornecido — use SÓ isto):
${sourcesToText(sources)}

SEÇÕES JÁ GERADAS (contexto — não repita, mantenha coerência):
${secoesToText(secoesAnteriores)}

GERE AGORA, e SOMENTE, estas seções (nesta ordem), no formato JSON especificado:
${secoesAlvo.map((s) => `- ${s}`).join("\n")}`;
}
