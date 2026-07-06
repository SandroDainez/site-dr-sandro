// Estrutura fixa do texto científico e o AGRUPAMENTO EM BLOCOS para geração por partes
// (mesma estratégia do Arquiteto: evita truncamento nas seções finais). Espelha o padrão
// de src/lib/editora/protocolo-estrutura.ts. Ver docs/ARQUITETURA-IA.md (Editor Científico:
// geração 2 estágios; sources = referências fornecidas).

// Reaproveita a taxonomia de especialidade/fonte do módulo de protocolos (mesma escolha
// de área e mesmo mapeamento para o CHECK do banco) — fonte única, sem duplicar regra.
export {
  ESPECIALIDADES_MODULO,
  mapEspecialidadeDB,
  TIPOS_FONTE,
  type EspecialidadeModulo,
  type TipoFonte,
} from "./protocolo-estrutura";

export const SCI_SECOES: string[] = [
  "Título",
  "Resumo",
  "Introdução",
  "Revisão da evidência",
  "Discussão",
  "Conclusão",
];

// 2 blocos de 3 seções (geração por partes, coerência mantida via seções anteriores).
export const SCI_BLOCOS: string[][] = [
  ["Título", "Resumo", "Introdução"],
  ["Revisão da evidência", "Discussão", "Conclusão"],
];
