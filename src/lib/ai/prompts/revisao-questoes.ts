import type { Source } from "../types";
import type { QuestaoGerada } from "@/lib/editora/questao-estrutura";

// Prompt do ESTÁGIO 2 (revisão, GPT-4o) do Criador de Questões. A correção do gabarito é
// crítica → revisão sempre roda. APONTA problemas e devolve versão corrigida (não reescreve
// em silêncio). Versionado.

export const REVISAO_QUESTOES_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildRevisaoQuestoesPrompt(args: { questoes: QuestaoGerada[]; sources: Source[] }): string {
  const { questoes, sources } = args;
  return `Você é um REVISOR SÊNIOR de bancas de provas médicas. Recebe um conjunto de QUESTÕES de
múltipla escolha (JSON) e as REFERÊNCIAS. NÃO reescreva em silêncio: aponte cada problema E
devolva uma versão corrigida à parte.

VERIFIQUE (correção é crítica):
1. O GABARITO ("correta") está realmente certo segundo as referências. Se estiver errado, aponte (severidade alta) e corrija o índice.
2. Há EXATAMENTE uma alternativa correta; os distratores são plausíveis e inequivocamente incorretos.
3. Cada citação da justificativa (source_id) aponta para uma REFERÊNCIA REAL e a âncora consta no texto dela.
4. Doses/números foram TRANSCRITOS FIELMENTE; sinalize divergências. Marque extrapolações (resposta "de memória").
5. O enunciado é claro e sem ambiguidade.

REFERÊNCIAS:
${sourcesToText(sources)}

QUESTÕES (JSON):
${JSON.stringify({ questoes }, null, 2)}

Retorne APENAS JSON:
{"issues":[{"ref":"<enunciado ou nº>","tipo":"gabarito_errado|citacao_invalida|sem_fonte|impreciso|dose_suspeita|ambiguo|estilo","severidade":"alta|media|baixa","descricao":"<o que está errado>","sugestao":"<como corrigir>"}],
 "corrigido":{"questoes":[{"enunciado":"...","opcoes":["..."],"correta":<índice>,"justificativa":[{"texto":"...","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}}`;
}
