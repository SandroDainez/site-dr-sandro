import { BLOCO_ANTI_ALUCINACAO } from "./anti-alucinacao";
import type { Source } from "../types";

// Prompt do módulo "Criador de Questões" (versionado). Gera N questões de múltipla escolha
// (MCQ) para MÉDICOS a partir das referências: enunciado, alternativas, gabarito e uma
// JUSTIFICATIVA com afirmações citadas (source_id + âncora). Sempre 2 estágios (a correção
// é crítica). Ver ARQUITETURA-IA §2/§4.

export const CRIADOR_QUESTOES_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources
    .map((s) => `[${s.id}] (${s.tipo}${s.autor ? `, ${s.autor}` : ""}${s.ano ? `, ${s.ano}` : ""}) ${s.titulo}\n${s.texto}`)
    .join("\n\n---\n\n");
}

export function buildCriadorQuestoesPrompt(args: {
  especialidade?: string;
  nivel?: string;
  quantidade: number;
  sources: Source[];
}): string {
  const { especialidade, nivel, quantidade, sources } = args;
  return `Você é um ELABORADOR DE QUESTÕES de provas médicas${especialidade ? ` (área: ${especialidade})` : ""}.
Gere exatamente ${quantidade} questões de MÚLTIPLA ESCOLHA (nível ${nivel || "Médio"}), em português do Brasil,
cobrindo os pontos mais relevantes das REFERÊNCIAS. Cada questão tem 4 a 5 alternativas, UMA correta.

${BLOCO_ANTI_ALUCINACAO}

REGRAS DA QUESTÃO (críticas):
- O enunciado é claro e autocontido; evite "todas/nenhuma das anteriores" e pegadinhas dúbias.
- Exatamente UMA alternativa correta; as demais (distratores) são plausíveis, porém incorretas segundo as referências.
- A resposta correta E a justificativa devem ser SUSTENTADAS pelas referências (não invente).
- A "justificativa" explica por que o gabarito está correto, em afirmações; cada afirmação clínica/dose
  DEVE ter source_id + âncora verbatim reais. O que não tiver respaldo vira "sem fonte" (source_id: null).
- "correta" é o ÍNDICE (0-based) da alternativa correta no array "opcoes".

REFERÊNCIAS (material fornecido — use SÓ isto):
${sourcesToText(sources)}

Retorne APENAS JSON no formato:
{"questoes":[{"enunciado":"<pergunta>","opcoes":["<alt A>","<alt B>","<alt C>","<alt D>"],"correta":<índice 0-based>,
  "justificativa":[{"texto":"<explicação>","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}
Gere ${quantidade} itens em "questoes".`;
}
