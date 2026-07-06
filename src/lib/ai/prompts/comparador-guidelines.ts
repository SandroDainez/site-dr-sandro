import { BLOCO_ANTI_ALUCINACAO } from "./anti-alucinacao";
import type { Source } from "../types";

// Prompt do módulo "Comparador de Guidelines" (retrieval). Recebe EVIDÊNCIAS recuperadas
// (biblioteca interna + PubMed) sobre um tema e produz uma COMPARAÇÃO por aspectos: para cada
// aspecto, o que cada fonte diz (citado). Cada "secao" é um ASPECTO; suas "afirmacoes" são as
// posições das fontes. Mesmo núcleo anti-alucinação + validação de citações. Ver ARQUITETURA-IA §2.

export const COMPARADOR_GUIDELINES_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources
    .map((s) => `[${s.id}] (${s.tipo}${s.autor ? `, ${s.autor}` : ""}${s.ano ? `, ${s.ano}` : ""}) ${s.titulo}\n${s.texto}`)
    .join("\n\n---\n\n");
}

export function buildComparadorPrompt(args: {
  especialidade?: string;
  tema: string;
  evidencias: Source[];
}): string {
  const { especialidade, tema, evidencias } = args;
  return `Você é um REVISOR que COMPARA diretrizes/fontes médicas${especialidade ? ` (área: ${especialidade})` : ""} sobre um tema.
Tema: "${tema}".
Sua tarefa: identificar os ASPECTOS relevantes de comparação e, para cada um, dizer o que CADA fonte
recomenda — destacando CONCORDÂNCIAS e DIVERGÊNCIAS. Português do Brasil, objetivo.

${BLOCO_ANTI_ALUCINACAO}

MAPEAMENTO PARA O FORMATO (importante):
- Cada ASPECTO de comparação é UM item de "secoes" ("secao" = nome do aspecto; ex.: "Vasopressor de 1ª linha").
- "afirmacoes" = uma por FONTE relevante àquele aspecto: o texto começa com a posição da fonte e cita
  o source_id + âncora verbatim. Se as fontes divergem, deixe claro. Se uma fonte não aborda o aspecto, não a inclua.
- NÃO invente posição de fonte; transcreva doses/números fielmente. Sem respaldo → "sem fonte" (source_id: null).
- Inclua um aspecto final "Síntese comparativa" resumindo concordâncias/divergências (também citado).

EVIDÊNCIAS RECUPERADAS (biblioteca interna + PubMed — use SÓ isto):
${sourcesToText(evidencias)}

Retorne APENAS JSON:
{"secoes":[{"secao":"<aspecto>","afirmacoes":[{"texto":"<posição da fonte>","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}`;
}
