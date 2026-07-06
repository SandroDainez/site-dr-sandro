// Parâmetros do Criador de Flashcards. Cada flashcard é modelado como um SecaoGerada:
// a FRENTE (pergunta) vira `secao` e o VERSO (resposta) vira as `afirmacoes` citadas —
// assim reaproveita a validação de citações/confidence do núcleo. Geração em 1 chamada
// (N cartões). Ver docs/ARQUITETURA-IA.md (Criador de Flashcards: 1–2 estágios).

export {
  ESPECIALIDADES_MODULO,
  mapEspecialidadeDB,
  TIPOS_FONTE,
  type EspecialidadeModulo,
  type TipoFonte,
} from "./protocolo-estrutura";

// Quantidades de cartões oferecidas na geração.
export const QUANTIDADES_FLASHCARD = [5, 10, 15, 20] as const;
export type QuantidadeFlashcard = (typeof QUANTIDADES_FLASHCARD)[number];
