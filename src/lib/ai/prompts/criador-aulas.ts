import { BLOCO_ANTI_ALUCINACAO } from "./anti-alucinacao";
import type { Source, SecaoGerada } from "../types";

// Prompt do módulo "Criador de Aulas" (versionado). Gera uma AULA em seções/slides para
// MÉDICOS a partir das referências, modulada pelo PÚBLICO-ALVO. Mesmo núcleo anti-alucinação
// + formato estruturado (afirmações com source_id + âncora). Ver ARQUITETURA-IA §2.

export const CRIADOR_AULAS_PROMPT_VERSION = "1.0.0";

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

// Monta o prompt de UM bloco: bloco anti-alucinação + instruções pedagógicas + público-alvo
// + sources + seções já geradas + seções-alvo deste bloco.
export function buildCriadorAulasPrompt(args: {
  especialidade?: string;
  publicoAlvo?: string;
  sources: Source[];
  secoesAlvo: string[];
  secoesAnteriores: SecaoGerada[];
}): string {
  const { especialidade, publicoAlvo, sources, secoesAlvo, secoesAnteriores } = args;
  return `Você é um PROFESSOR de medicina montando uma AULA${especialidade ? ` (área: ${especialidade})` : ""}.
Público-alvo: ${publicoAlvo || "Médicos"} — ajuste a PROFUNDIDADE e o vocabulário a esse público.
Sua tarefa: redigir APENAS as seções deste bloco da aula (cada seção é um slide/tópico), em
português do Brasil, didática e objetiva, com cada afirmação relevante ancorada nas REFERÊNCIAS.

${BLOCO_ANTI_ALUCINACAO}

DIRETRIZES PEDAGÓGICAS:
- "Título": título didático da aula (tipo "geral", sem exigir fonte).
- "Objetivos de aprendizagem": objetivos claros e verificáveis (o que o aluno saberá ao final).
- Cada afirmação clínica/número/dose deve estar ancorada numa referência (âncora verbatim), transcrita fielmente.
- Adeque o nível ao público-alvo, mas NÃO invente conteúdo fora das referências; lacunas viram "sem fonte".
- "Pontos-chave" e "Resumo": consolidam o que foi sustentado pelas referências, sem introduzir dado novo.

REFERÊNCIAS (material fornecido — use SÓ isto para sustentar afirmações):
${sourcesToText(sources)}

SEÇÕES JÁ GERADAS (contexto — não repita, mantenha coerência):
${secoesToText(secoesAnteriores)}

GERE AGORA, e SOMENTE, estas seções (nesta ordem), no formato JSON especificado:
${secoesAlvo.map((s) => `- ${s}`).join("\n")}`;
}
