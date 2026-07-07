import type { Afirmacao, SecaoGerada } from "@/lib/ai/types";

// Parâmetros e tipos do Criador de Questões (MCQ). Cada questão tem enunciado, opções,
// gabarito e uma JUSTIFICATIVA composta de afirmações citadas (é sobre ela que roda a
// validação de citações/confidence do núcleo). Ver docs/ARQUITETURA-IA.md.

export {
  ESPECIALIDADES_MODULO,
  mapEspecialidadeDB,
  TIPOS_FONTE,
  type EspecialidadeModulo,
  type TipoFonte,
} from "./protocolo-estrutura";

export const NIVEIS_QUESTAO = ["Fácil", "Médio", "Difícil"] as const;
export type NivelQuestao = (typeof NIVEIS_QUESTAO)[number];

export const QUANTIDADES_QUESTAO = [3, 5, 10] as const;
export type QuantidadeQuestao = (typeof QUANTIDADES_QUESTAO)[number];

export type QuestaoGerada = {
  enunciado: string;
  opcoes: string[];       // alternativas (texto)
  correta: number;        // índice (0-based) da opção correta
  justificativa: Afirmacao[]; // explicação do gabarito, ancorada nas referências
};

// Para reaproveitar a validação de citações do núcleo: cada questão vira um SecaoGerada
// (enunciado = secao; justificativa = afirmacoes).
export function questoesToSecoes(qs: QuestaoGerada[]): SecaoGerada[] {
  return (qs ?? []).map((q) => ({ secao: q.enunciado, afirmacoes: q.justificativa ?? [] }));
}

// Renderiza a justificativa como texto (com marcadores de citação / sem fonte).
export function justificativaTexto(q: QuestaoGerada): string {
  return (q.justificativa ?? [])
    .map((a) => a.texto)
    .join(" ");
}
