import { BLOCO_ANTI_ALUCINACAO } from "./anti-alucinacao";
import type { Source } from "../types";

// Prompt do módulo "Pesquisador Científico" (retrieval). Recebe EVIDÊNCIAS recuperadas
// (biblioteca interna + PubMed) sobre uma pergunta e produz uma SÍNTESE de evidências com
// fontes. Seções fixas; cada afirmação citada. Mesmo núcleo anti-alucinação. Ver ARQUITETURA-IA §2.

export const PESQUISADOR_CIENTIFICO_PROMPT_VERSION = "1.0.0";

export const PESQUISA_SECOES = ["Contexto e pergunta", "Evidências principais", "Síntese", "Lacunas e conclusão"];

function sourcesToText(sources: Source[]): string {
  return sources
    .map((s) => `[${s.id}] (${s.tipo}${s.autor ? `, ${s.autor}` : ""}${s.ano ? `, ${s.ano}` : ""}) ${s.titulo}\n${s.texto}`)
    .join("\n\n---\n\n");
}

export function buildPesquisadorPrompt(args: {
  especialidade?: string;
  tema: string;
  evidencias: Source[];
}): string {
  const { especialidade, tema, evidencias } = args;
  return `Você é um PESQUISADOR médico${especialidade ? ` (área: ${especialidade})` : ""} fazendo uma SÍNTESE de evidências.
Pergunta/tema: "${tema}".
Sua tarefa: sintetizar o que as EVIDÊNCIAS recuperadas dizem sobre o tema, de forma crítica e citada,
em português do Brasil. Não é opinião: é o que as fontes sustentam.

${BLOCO_ANTI_ALUCINACAO}

ESTRUTURA (uma "secao" para cada, nesta ordem):
- "Contexto e pergunta": enquadra o problema (pode ser tipo "geral").
- "Evidências principais": o que cada evidência relevante mostra, citada (source_id + âncora verbatim).
- "Síntese": o quadro geral que emerge das evidências (consistências e contradições), citado.
- "Lacunas e conclusão": o que ainda falta / conclusão prudente sustentada pelas fontes.
Cada afirmação clínica/dose exige fonte; o que não tiver respaldo vira "sem fonte" (source_id: null).
NÃO invente resultados nem números; transcreva doses/estatísticas fielmente das evidências.

EVIDÊNCIAS RECUPERADAS (biblioteca interna + PubMed — use SÓ isto):
${sourcesToText(evidencias)}

Retorne APENAS JSON:
{"secoes":[{"secao":"<nome>","afirmacoes":[{"texto":"...","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}`;
}
