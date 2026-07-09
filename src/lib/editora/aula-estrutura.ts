// Estrutura da aula (seções = slides/tópicos) e o AGRUPAMENTO EM BLOCOS para geração por
// partes. Espelha o padrão de protocolo-estrutura.ts. Ver docs/ARQUITETURA-IA.md.
//
// v2 (jul/2026): aula elevada de 7 para 13 seções + diretriz de COMPLETUDE (mesmo padrão do
// Arquiteto de Protocolos) — feedback do usuário: aula "muito simplificada" (confiança 65%),
// e o conteúdo precisa suportar cursos completos, não só slides soltos. Adicionado parâmetro
// de DURAÇÃO ALVO (modula a profundidade de cada seção, não o número de seções — dividir uma
// aula longa em várias "partes" de 10-15min fica para uma próxima etapa estrutural).

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
  "Pré-requisitos",
  "Introdução e relevância clínica",
  "Conceitos fundamentais",
  "Mecanismo e fisiopatologia",
  "Abordagem clínica e conduta",
  "Caso clínico ilustrativo",
  "Armadilhas e erros comuns",
  "Perguntas de fixação",
  "Pontos-chave",
  "Resumo",
  "Referências",
];

// 8 blocos (1-2 seções por chamada) — mesmo cuidado do protocolo: seções mais densas
// (conceitos/mecanismo/abordagem) sozinhas, evitando saturar o teto de tokens de saída com
// a diretriz de completude ativa.
export const AULA_BLOCOS: string[][] = [
  ["Título", "Objetivos de aprendizagem"],
  ["Pré-requisitos", "Introdução e relevância clínica"],
  ["Conceitos fundamentais"],
  ["Mecanismo e fisiopatologia"],
  ["Abordagem clínica e conduta"],
  ["Caso clínico ilustrativo", "Armadilhas e erros comuns"],
  ["Perguntas de fixação", "Pontos-chave"],
  ["Resumo", "Referências"],
];

// Seções OPERACIONAIS/de síntese: sintetizam o que já foi gerado/citado (tipo "geral"),
// nunca introduzem fato novo — mesmo padrão do protocolo.
export const AULA_SECOES_OPERACIONAIS: string[] = ["Perguntas de fixação", "Pontos-chave", "Resumo"];

// Público-alvo da aula (parâmetro que modula profundidade/tom no prompt).
export const PUBLICOS_ALVO = [
  "Estudante de medicina",
  "Residente",
  "Especialista",
  "Equipe multiprofissional",
] as const;
export type PublicoAlvo = (typeof PUBLICOS_ALVO)[number];

// Duração alvo da aula — modula a PROFUNDIDADE de cada seção (não o número de seções).
// Aulas longas/de curso: use "Aprofundada" e, se o tema for muito extenso, considere criar
// mais de uma aula (ex.: "Parte 1", "Parte 2") em vez de uma só gigante.
export const DURACOES_ALVO = [
  "Rápida (5–10 min)",
  "Padrão (10–15 min)",
  "Aprofundada (20–30 min, tipo aula de curso)",
] as const;
export type DuracaoAlvo = (typeof DURACOES_ALVO)[number];
