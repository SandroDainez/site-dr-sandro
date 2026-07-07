// Constantes e tipos de multi-especialidade da Editora (módulo COMUM, sem "use server").
// IMPORTANTE: estas constantes NÃO podem morar no arquivo areas-actions.ts, porque um
// módulo "use server" só pode exportar funções async — qualquer const exportada de lá vira
// uma referência de server-action no client (quebra `AREAS_SITE.map` na renderização).

// Áreas do site (mesmos códigos usados em /especialidade/[area] e nos hubs).
export const AREAS_SITE = [
  { id: "anestesiologia", label: "Anestesiologia" },
  { id: "ti", label: "Terapia Intensiva" },
  { id: "emergencias", label: "Emergências" },
] as const;
export type AreaSite = (typeof AREAS_SITE)[number]["id"];
export const AREA_IDS = AREAS_SITE.map((a) => a.id) as readonly string[];

// Tabelas doc da Editora que têm a coluna `areas` (allowlist — nunca aceitar tabela livre).
export const TABELAS_EDITORA = [
  "protocols", "sci_docs", "aula_docs", "flashcard_docs", "questao_docs", "research_docs", "protocol_update_docs",
] as const;
export type TabelaEditora = (typeof TABELAS_EDITORA)[number];

export function validarTabelaEditora(t: string): t is TabelaEditora {
  return (TABELAS_EDITORA as readonly string[]).includes(t);
}
