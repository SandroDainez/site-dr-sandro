import { BLOCO_ANTI_ALUCINACAO } from "./anti-alucinacao";
import type { Source } from "../types";

// Prompt do módulo "Criador de Flashcards" (versionado). Gera N cartões frente/verso para
// MÉDICOS a partir das referências. Cada cartão = um item "secoes": a FRENTE vira `secao`
// (pergunta) e o VERSO vira as `afirmacoes` (resposta citada) — mesmo formato JSON do núcleo,
// reaproveitando a validação de citações. Ver ARQUITETURA-IA §2/§4.

export const CRIADOR_FLASHCARDS_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources
    .map((s) => `[${s.id}] (${s.tipo}${s.autor ? `, ${s.autor}` : ""}${s.ano ? `, ${s.ano}` : ""}) ${s.titulo}\n${s.texto}`)
    .join("\n\n---\n\n");
}

export function buildCriadorFlashcardsPrompt(args: {
  especialidade?: string;
  quantidade: number;
  sources: Source[];
}): string {
  const { especialidade, quantidade, sources } = args;
  return `Você é um PROFESSOR de medicina criando FLASHCARDS de estudo${especialidade ? ` (área: ${especialidade})` : ""}, para MÉDICOS.
Gere exatamente ${quantidade} flashcards (pares frente/verso) cobrindo os pontos mais relevantes das REFERÊNCIAS,
em português do Brasil. Cada afirmação do VERSO deve estar ancorada nas referências.

${BLOCO_ANTI_ALUCINACAO}

MAPEAMENTO PARA O FORMATO (importante):
- Cada flashcard é UM item de "secoes".
- "secao" = a FRENTE do cartão: uma pergunta objetiva e autocontida (texto, sem exigir fonte).
- "afirmacoes" = o VERSO do cartão: a resposta, quebrada em afirmações. Cada afirmação clínica/dose
  DEVE ter source_id + âncora verbatim reais; o que não tiver respaldo vira "sem fonte" (source_id: null).
- NÃO invente dados; transcreva doses/números fielmente da referência (na âncora).
- Faça perguntas úteis para memorização (fatos, condutas, doses, definições), sem ambiguidade.

REFERÊNCIAS (material fornecido — use SÓ isto para sustentar as respostas):
${sourcesToText(sources)}

Retorne APENAS JSON no formato:
{"secoes":[{"secao":"<pergunta/frente>","afirmacoes":[{"texto":"<resposta/verso>","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}
Gere ${quantidade} itens em "secoes".`;
}
