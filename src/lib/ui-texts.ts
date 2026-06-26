// Textos curtos / botões da interface (frases soltas que não são título de seção).
// Client-safe. Defaults aqui são a fonte única; o site lê via uiText().

export type UiTextsData = Record<string, string>;

export const UI_TEXTS: { key: string; group: string; label: string; default: string }[] = [
  { key: "heroCtaPrimary", group: "Botões do topo (destaque)", label: "Botão principal", default: "Explorar plataforma" },
  { key: "heroCtaSecondary", group: "Botões do topo (destaque)", label: "Botão secundário", default: "Ver agenda de eventos" },

  { key: "verMais", group: "Links e botões gerais", label: "Link “Ver todos” das seções da home", default: "Ver todos" },
  { key: "footerVoltar", group: "Links e botões gerais", label: "Botão “Voltar ao início” (rodapé)", default: "Voltar ao início" },

  { key: "cursoPagoTitulo", group: "Página de curso (curso pago)", label: "Título quando o curso é pago/bloqueado", default: "Curso por assinatura — em breve" },
  { key: "cursoPagoTexto", group: "Página de curso (curso pago)", label: "Texto quando o curso é pago/bloqueado", default: "Este curso fará parte da área de assinatura. Em breve você poderá assiná-lo individualmente ou pelo plano que libera todos os cursos." },
];

const DEFAULTS: Record<string, string> = Object.fromEntries(UI_TEXTS.map((u) => [u.key, u.default]));

export function uiText(data: UiTextsData | undefined, key: string): string {
  const v = data?.[key];
  if (v && v.trim()) return v;
  return DEFAULTS[key] ?? "";
}
