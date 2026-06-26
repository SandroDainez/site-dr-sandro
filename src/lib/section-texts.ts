// Textos editáveis dos títulos das seções (rótulo pequeno + título grande).
// Client-safe (sem Node). Os defaults aqui são a fonte única — a home lê via secText().

export type SectionText = { eyebrow?: string; title?: string };
export type SectionTextsData = Record<string, SectionText>;

export const SECTION_TEXTS: { key: string; label: string; eyebrow: string; title: string }[] = [
  { key: "apps", label: "Apps por assinatura", eyebrow: "Aplicativos por assinatura", title: "Apps médicos para decisão clínica" },
  { key: "freeApps", label: "Apps grátis", eyebrow: "Aplicativos gratuitos", title: "Acesso aberto imediato" },
  { key: "utilApps", label: "Apps do dia a dia", eyebrow: "Para o seu dia a dia", title: "Apps para organização e finanças pessoais" },
  { key: "atualizacoes", label: "Atualizações (home)", eyebrow: "Conteúdo recente", title: "Atualizações clínicas" },
  { key: "protocolos", label: "Protocolos (home)", eyebrow: "Condutas clínicas", title: "Protocolos Clínicos" },
  { key: "videoaulas", label: "Videoaulas (home)", eyebrow: "Aulas em vídeo", title: "Videoaulas" },
  { key: "colaboradores", label: "Colaboradores (home)", eyebrow: "Comunidade médica", title: "Vídeos de colaboradores" },
  { key: "cursos", label: "Cursos / atualização contínua (home)", eyebrow: "Cursos presenciais, híbridos e online", title: "Atualização médica contínua" },
  { key: "podcast", label: "Podcast (home)", eyebrow: "Áudio e vídeo", title: "Podcast" },
  { key: "contato", label: "Contato (home)", eyebrow: "Contato", title: "Canais para inscrição e suporte" },
];

const DEFAULTS: Record<string, { eyebrow: string; title: string }> = Object.fromEntries(
  SECTION_TEXTS.map((s) => [s.key, { eyebrow: s.eyebrow, title: s.title }])
);

// Retorna o texto salvo (override) ou o padrão do registro.
export function secText(
  data: SectionTextsData | undefined,
  key: string,
  field: "eyebrow" | "title"
): string {
  const override = data?.[key]?.[field];
  if (override && override.trim()) return override;
  return DEFAULTS[key]?.[field] ?? "";
}
