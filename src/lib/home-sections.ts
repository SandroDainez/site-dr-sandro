// IDs e ordem padrão das seções da home — módulo puro (sem código de servidor),
// para poder ser importado tanto no servidor (content.ts) quanto no cliente
// (editor de ordem no admin). Ordem lógica: clínico → mídia → comunidade → apps
// → eventos/contato.
export const HOME_SECTION_IDS = [
  "atualizacoes", "protocolos", "procedimentos", "videoaulas", "cursos", "podcast",
  "colaboradores", "acervo", "apps-assinatura", "apps-gratis", "apps-uteis",
  "eventos", "contato",
] as const;

export const DEFAULT_HOME_ORDER: string[] = [...HOME_SECTION_IDS];

// Seções cujo nº de colunas (cards por linha) é configurável no admin.
// def = padrão no desktop; tablet cai p/ 2 e celular p/ 1 (via .card-grid no CSS).
export const CARD_COL_SECTIONS: { key: string; label: string; def: number }[] = [
  { key: "especialidades", label: "Especialidades", def: 3 },
  { key: "apps-assinatura", label: "Apps por assinatura", def: 3 },
  { key: "apps-gratis", label: "Apps grátis", def: 3 },
  { key: "apps-uteis", label: "Apps do dia a dia", def: 3 },
  { key: "protocolos", label: "Protocolos", def: 3 },
  { key: "videoaulas", label: "Videoaulas", def: 3 },
];
export const DEFAULT_CARD_COLS: Record<string, number> = Object.fromEntries(
  CARD_COL_SECTIONS.map((s) => [s.key, s.def]),
);
