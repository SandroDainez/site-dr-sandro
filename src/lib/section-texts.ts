// Textos editáveis dos títulos/subtítulos das seções (home) e das páginas internas.
// Client-safe (sem Node). Os defaults aqui são a fonte única — o site lê via secText().

export type SectionText = { eyebrow?: string; title?: string; desc?: string };
export type SectionTextsData = Record<string, SectionText>;

type Entry = { key: string; group: string; label: string; eyebrow: string; title: string; desc?: string };

export const SECTION_TEXTS: Entry[] = [
  // ── Página inicial ───────────────────────────────────────────────
  { key: "especialidades_band", group: "Página inicial", label: "Navegue por especialidade (home)", eyebrow: "Comece por aqui", title: "Navegue por especialidade" },
  { key: "apps", group: "Página inicial", label: "Apps por assinatura", eyebrow: "Aplicativos por assinatura", title: "Apps médicos para decisão clínica", desc: "Ferramentas de apoio à decisão clínica. Não substituem a avaliação, o julgamento e a responsabilidade do médico. A palavra final é sempre do profissional responsável." },
  { key: "freeApps", group: "Página inicial", label: "Apps grátis", eyebrow: "Aplicativos gratuitos", title: "Acesso aberto imediato" },
  { key: "utilApps", group: "Página inicial", label: "Apps do dia a dia", eyebrow: "Para o seu dia a dia", title: "Apps para organização e finanças pessoais", desc: "Ferramentas que ajudam no dia a dia — controle de gastos, organização pessoal, planejamento financeiro e mais. Úteis também fora da medicina, pra facilitar a sua rotina." },
  { key: "atualizacoes", group: "Página inicial", label: "Atualizações (home)", eyebrow: "Conteúdo recente", title: "Atualizações clínicas" },
  { key: "protocolos", group: "Página inicial", label: "Protocolos (home)", eyebrow: "Condutas clínicas", title: "Protocolos Clínicos" },
  { key: "videoaulas", group: "Página inicial", label: "Videoaulas (home)", eyebrow: "Aulas em vídeo", title: "Videoaulas" },
  { key: "colaboradores", group: "Página inicial", label: "Parceiros (home)", eyebrow: "Material de parceiros", title: "Profissionais parceiros" },
  { key: "cursos", group: "Página inicial", label: "Cursos / atualização contínua (home)", eyebrow: "Cursos presenciais, híbridos e online", title: "Atualização médica contínua" },
  { key: "podcast", group: "Página inicial", label: "Podcast (home)", eyebrow: "Áudio e vídeo", title: "Podcast" },
  { key: "contato", group: "Página inicial", label: "Contato (home)", eyebrow: "Contato", title: "Canais para inscrição e suporte" },
  { key: "acervo", group: "Página inicial", label: "Outros assuntos (home)", eyebrow: "Conteúdos e materiais", title: "Outros assuntos", desc: "Qualquer tema, inclusive fora da medicina — textos, vídeos, PDFs e livros para baixar." },
  { key: "procedimentos", group: "Página inicial", label: "Procedimentos (home)", eyebrow: "Técnica e prática", title: "Procedimentos médicos" },

  // ── Páginas internas (topo de cada página) ───────────────────────
  { key: "page_atualizacoes", group: "Páginas internas", label: "Página Atualizações", eyebrow: "Conteúdo clínico", title: "Atualizações", desc: "Revisão rápida e direto ao ponto da evidência mais recente, por área clínica." },
  { key: "page_atualizacoes_semanais", group: "Páginas internas", label: "Página Atualizações — histórico semanal", eyebrow: "Boletins clínicos · automático", title: "Atualizações clínicas da semana", desc: "Histórico de todas as atualizações geradas semanalmente, por especialidade — com tópicos, relevância clínica e todas as fontes consultadas. Consulte qualquer semana anterior." },
  { key: "page_protocolos", group: "Páginas internas", label: "Página Protocolos", eyebrow: "Condutas clínicas", title: "Protocolos Clínicos", desc: "Algoritmos e condutas por área" },
  { key: "page_videoaulas", group: "Páginas internas", label: "Página Videoaulas", eyebrow: "Conteúdo em vídeo", title: "Videoaulas", desc: "Aulas médicas em vídeo por área" },
  { key: "page_cursos", group: "Páginas internas", label: "Página Cursos", eyebrow: "Formação médica", title: "Cursos", desc: "Cursos com aulas sequenciais, vídeos, slides e materiais para download. Conteúdo gratuito de acesso imediato — cursos completos por assinatura em breve." },
  { key: "page_podcast", group: "Páginas internas", label: "Página Podcast", eyebrow: "Áudio e vídeo", title: "Podcast", desc: "Episódios em áudio e vídeo — discussão de casos, condutas e atualizações. Assista ou ouça aqui, ou no seu app favorito." },
  { key: "page_colaboradores", group: "Páginas internas", label: "Página Parceiros", eyebrow: "Parceiros do portal", title: "Profissionais parceiros", desc: "Materiais generosamente cedidos por colegas de outras instituições. O conteúdo é de autoria deles, com todo o crédito — nosso muito obrigado a cada profissional que compartilha conhecimento aqui." },
  { key: "page_acervo", group: "Páginas internas", label: "Página Outros assuntos", eyebrow: "Conteúdos e materiais", title: "Outros assuntos", desc: "Qualquer tema, inclusive fora da medicina — textos, vídeos, PDFs e livros para baixar." },
  { key: "page_procedimentos", group: "Páginas internas", label: "Página Procedimentos", eyebrow: "Técnica e prática", title: "Procedimentos médicos", desc: "Procedimentos e técnicas com vídeo, passo a passo e materiais para baixar — por especialidade." },

  // ── Especialidades (hubs /especialidade/...) — topo de cada hub ──────────────
  { key: "hub_emergencias", group: "Especialidades", label: "Hub Emergências", eyebrow: "Especialidade", title: "Emergências", desc: "Condutas, protocolos e materiais de medicina de urgência e emergência." },
  { key: "hub_ti", group: "Especialidades", label: "Hub Terapia Intensiva", eyebrow: "Especialidade", title: "Terapia Intensiva", desc: "Tudo de cuidados intensivos: protocolos, aulas, cursos e materiais." },
  { key: "hub_anestesiologia", group: "Especialidades", label: "Hub Anestesiologia", eyebrow: "Especialidade", title: "Anestesiologia", desc: "Condutas, documentos e conteúdo de anestesiologia num só lugar." },
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
