// Textos editáveis dos títulos/subtítulos das seções (home) e das páginas internas.
// Client-safe (sem Node). Os defaults aqui são a fonte única — o site lê via secText().

export type SectionText = { eyebrow?: string; title?: string; desc?: string };
export type SectionTextsData = Record<string, SectionText>;

type Entry = { key: string; group: string; label: string; eyebrow: string; title: string; desc?: string };

export const SECTION_TEXTS: Entry[] = [
  // ── Página inicial ───────────────────────────────────────────────
  { key: "apps", group: "Página inicial", label: "Apps por assinatura", eyebrow: "Aplicativos por assinatura", title: "Apps médicos para decisão clínica", desc: "Ferramentas de apoio à decisão clínica. Não substituem a avaliação, o julgamento e a responsabilidade do médico. A palavra final é sempre do profissional responsável." },
  { key: "freeApps", group: "Página inicial", label: "Apps grátis", eyebrow: "Aplicativos gratuitos", title: "Acesso aberto imediato" },
  { key: "utilApps", group: "Página inicial", label: "Apps do dia a dia", eyebrow: "Para o seu dia a dia", title: "Apps para organização e finanças pessoais", desc: "Ferramentas que ajudam no dia a dia — controle de gastos, organização pessoal, planejamento financeiro e mais. Úteis também fora da medicina, pra facilitar a sua rotina." },
  { key: "atualizacoes", group: "Página inicial", label: "Atualizações (home)", eyebrow: "Conteúdo recente", title: "Atualizações clínicas" },
  { key: "protocolos", group: "Página inicial", label: "Protocolos (home)", eyebrow: "Condutas clínicas", title: "Protocolos Clínicos" },
  { key: "videoaulas", group: "Página inicial", label: "Videoaulas (home)", eyebrow: "Aulas em vídeo", title: "Videoaulas" },
  { key: "colaboradores", group: "Página inicial", label: "Colaboradores (home)", eyebrow: "Comunidade médica", title: "Vídeos de colaboradores" },
  { key: "cursos", group: "Página inicial", label: "Cursos / atualização contínua (home)", eyebrow: "Cursos presenciais, híbridos e online", title: "Atualização médica contínua" },
  { key: "podcast", group: "Página inicial", label: "Podcast (home)", eyebrow: "Áudio e vídeo", title: "Podcast" },
  { key: "contato", group: "Página inicial", label: "Contato (home)", eyebrow: "Contato", title: "Canais para inscrição e suporte" },

  // ── Páginas internas (topo de cada página) ───────────────────────
  { key: "page_atualizacoes", group: "Páginas internas", label: "Página Atualizações", eyebrow: "Conteúdo clínico", title: "Atualizações", desc: "Revisão rápida e direto ao ponto da evidência mais recente, por área clínica." },
  { key: "page_protocolos", group: "Páginas internas", label: "Página Protocolos", eyebrow: "Condutas clínicas", title: "Protocolos Clínicos", desc: "Algoritmos e condutas por área" },
  { key: "page_videoaulas", group: "Páginas internas", label: "Página Videoaulas", eyebrow: "Conteúdo em vídeo", title: "Videoaulas", desc: "Aulas médicas em vídeo por área" },
  { key: "page_cursos", group: "Páginas internas", label: "Página Cursos", eyebrow: "Formação médica", title: "Cursos", desc: "Cursos com aulas sequenciais, vídeos, slides e materiais para download. Conteúdo gratuito de acesso imediato — cursos completos por assinatura em breve." },
  { key: "page_podcast", group: "Páginas internas", label: "Página Podcast", eyebrow: "Áudio e vídeo", title: "Podcast", desc: "Episódios em áudio e vídeo — discussão de casos, condutas e atualizações. Assista ou ouça aqui, ou no seu app favorito." },
  { key: "page_colaboradores", group: "Páginas internas", label: "Página Colaboradores", eyebrow: "Comunidade médica", title: "Vídeos de colaboradores", desc: "Conteúdo de outros médicos que autorizaram a publicação, com crédito ao autor." },
];

const DEFAULTS: Record<string, Entry> = Object.fromEntries(SECTION_TEXTS.map((s) => [s.key, s]));

// Retorna o texto salvo (override) ou o padrão do registro.
export function secText(
  data: SectionTextsData | undefined,
  key: string,
  field: "eyebrow" | "title" | "desc"
): string {
  const override = data?.[key]?.[field];
  if (override && override.trim()) return override;
  return DEFAULTS[key]?.[field] ?? "";
}
