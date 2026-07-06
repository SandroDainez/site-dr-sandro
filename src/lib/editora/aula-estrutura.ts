// Estrutura fixa da aula (seções = slides) e o AGRUPAMENTO EM BLOCOS para geração por
// partes. Espelha o padrão de protocolo-estrutura.ts. Ver docs/ARQUITETURA-IA.md
// (Criador de Aulas: geração 2 estágios; saída em seções/slides; público-alvo como parâmetro).

export {
  ESPECIALIDADES_MODULO,
  mapEspecialidadeDB,
  TIPOS_FONTE,
  type EspecialidadeModulo,
  type TipoFonte,
} from "./protocolo-estrutura";

export const AULA_SECOES: string[] = [
  "Título",
  "Objetivos de aprendizagem",
  "Introdução",
  "Conteúdo principal",
  "Aplicação clínica",
  "Pontos-chave",
  "Resumo",
];

// 3 blocos (2-3 seções por chamada).
export const AULA_BLOCOS: string[][] = [
  ["Título", "Objetivos de aprendizagem", "Introdução"],
  ["Conteúdo principal", "Aplicação clínica"],
  ["Pontos-chave", "Resumo"],
];

// Público-alvo da aula (parâmetro que modula profundidade/tom no prompt).
export const PUBLICOS_ALVO = [
  "Estudante de medicina",
  "Residente",
  "Especialista",
  "Equipe multiprofissional",
] as const;
export type PublicoAlvo = (typeof PUBLICOS_ALVO)[number];
