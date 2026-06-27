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
