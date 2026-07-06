// Estrutura fixa institucional do protocolo (24 seções) e o AGRUPAMENTO EM BLOCOS
// para geração por partes (3-4 seções por chamada — evita truncamento nas seções
// finais, justamente Doses e Referências). Ver docs/ARQUITETURA-IA.md.

export const PROTOCOLO_SECOES: string[] = [
  "Título",
  "Objetivo",
  "Quando utilizar",
  "Definições",
  "Critérios diagnósticos",
  "Avaliação inicial",
  "Estabilização imediata",
  "Estratificação de gravidade",
  "Diagnóstico diferencial",
  "Exames",
  "Tratamento",
  "Doses e medicamentos",
  "Monitorização",
  "Reavaliação",
  "Critérios de UTI",
  "Critérios de alta",
  "Situações especiais",
  "Populações especiais",
  "Complicações",
  "Armadilhas clínicas",
  "Pontos-chave",
  "Fluxograma",
  "Checklist",
  "Referências",
];

// 6 blocos de 4 seções (3-4 por chamada, conforme exigido).
export const PROTOCOLO_BLOCOS: string[][] = [
  ["Título", "Objetivo", "Quando utilizar", "Definições"],
  ["Critérios diagnósticos", "Avaliação inicial", "Estabilização imediata", "Estratificação de gravidade"],
  ["Diagnóstico diferencial", "Exames", "Tratamento", "Doses e medicamentos"],
  ["Monitorização", "Reavaliação", "Critérios de UTI", "Critérios de alta"],
  ["Situações especiais", "Populações especiais", "Complicações", "Armadilhas clínicas"],
  ["Pontos-chave", "Fluxograma", "Checklist", "Referências"],
];

// Escolha de especialidade/tipo do módulo (mais granular que a coluna do banco).
export const ESPECIALIDADES_MODULO = [
  "UTI", "Emergência", "Anestesiologia", "Cardiologia", "Infectologia", "Outro",
] as const;
export type EspecialidadeModulo = (typeof ESPECIALIDADES_MODULO)[number];

// Mapeia a escolha do módulo para o CHECK do banco (protocols.specialty).
// Cardiologia/Infectologia/Outro caem em 'geral' (o banco ainda não tem essas áreas —
// a escolha original fica preservada no conteúdo da versão). Ver nota no Comando 5.
export function mapEspecialidadeDB(e: string): "emergencias" | "ti" | "anestesiologia" | "geral" {
  switch (e) {
    case "UTI": return "ti";
    case "Emergência": return "emergencias";
    case "Anestesiologia": return "anestesiologia";
    default: return "geral";
  }
}

// Tipos de fonte aceitos na ingestão (piloto: só texto colado).
export const TIPOS_FONTE = ["guideline", "artigo", "livro", "consenso"] as const;
export type TipoFonte = (typeof TIPOS_FONTE)[number];
