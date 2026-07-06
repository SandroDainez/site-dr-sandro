// Estrutura fixa do menu principal: poucos botões, cada um agrupando os assuntos
// relacionados. Definida em código (estável). Os conteúdos de cada seção seguem
// editáveis no admin normalmente — o que é fixo aqui é só a montagem dos grupos.

export type NavLink = { label: string; href: string; emoji?: string; logoUrl?: string };
export type NavGroup = { label: string; href?: string; children?: NavLink[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: "Início", href: "/" },
  {
    label: "Especialidades",
    children: [
      { label: "Emergências", href: "/especialidade/emergencias", emoji: "🚑" },
      { label: "Terapia Intensiva", href: "/especialidade/ti", emoji: "🏥" },
      { label: "Anestesiologia", href: "/especialidade/anestesiologia", emoji: "🩺" },
    ],
  },
  { label: "Cursos", href: "/cursos" },
  {
    label: "Apps",
    children: [
      { label: "Apps gratuitos", href: "#apps-gratis" },
      { label: "Apps por assinatura", href: "#apps-assinatura" },
      { label: "Apps do dia a dia", href: "#apps-uteis" },
    ],
  },
  { label: "Eventos", href: "#eventos" },
  // Secundários recolhidos em "Mais" para a barra caber numa linha só.
  {
    label: "Mais",
    children: [
      { label: "Atualizações", href: "/atualizacoes" },
      { label: "Artigos", href: "/artigos" },
      { label: "Videoaulas", href: "/videoaulas" },
      { label: "Protocolos", href: "/protocolos" },
      { label: "Procedimentos", href: "/procedimentos" },
      { label: "Podcast", href: "/podcast" },
      { label: "Parceiros", href: "/colaboradores" },
      { label: "Outros assuntos", href: "/acervo" },
    ],
  },
  { label: "Contato", href: "#contato" },
];

// Edições do menu feitas no admin (guardadas no blob "navOverride"). As CHAVES são
// sempre o LABEL ORIGINAL do item (identidade estável) — renomear só muda a exibição.
export type NavOverride = {
  order?: string[];                       // ordem dos grupos do topo (labels originais)
  hidden?: string[];                      // labels originais ocultos (grupo OU filho)
  labels?: Record<string, string>;        // label original -> novo texto
  childOrder?: Record<string, string[]>;  // grupo (label original) -> ordem dos filhos
};

// Aplica a override sobre a estrutura fixa: oculta, reordena e renomeia — sem inventar
// itens (só mexe no que existe em NAV_GROUPS, então nunca cria link quebrado).
export function applyNavOverride(groups: NavGroup[], ov?: NavOverride): NavGroup[] {
  if (!ov) return groups;
  const hidden = new Set(ov.hidden ?? []);
  const relabel = (l: string) => (ov.labels?.[l]?.trim() ? ov.labels![l].trim() : l);

  let tops = groups.filter((g) => !hidden.has(g.label));
  if (ov.order?.length) {
    const idx = (l: string) => { const i = ov.order!.indexOf(l); return i < 0 ? 999 : i; };
    tops = [...tops].sort((a, b) => idx(a.label) - idx(b.label));
  }
  return tops.map((g) => {
    let children = g.children;
    if (children) {
      let cs = children.filter((c) => !hidden.has(c.label));
      const ordC = ov.childOrder?.[g.label];
      if (ordC?.length) {
        const idx = (l: string) => { const i = ordC.indexOf(l); return i < 0 ? 999 : i; };
        cs = [...cs].sort((a, b) => idx(a.label) - idx(b.label));
      }
      children = cs.map((c) => ({ ...c, label: relabel(c.label) }));
    }
    return { ...g, label: relabel(g.label), children };
  });
}

// Resolve href conforme a página: em páginas internas, âncoras "#x" viram "/#x".
export function resolveHref(href: string, internal: boolean): string {
  const h = href || "#";
  if (internal && h.startsWith("#")) return "/" + h;
  return h;
}

// Um grupo está "ativo" se a página atual é o próprio href (Início) ou um dos filhos.
export function isGroupActive(group: NavGroup, currentPath?: string): boolean {
  if (!currentPath) return false;
  if (group.href && group.href === currentPath) return true;
  return !!group.children?.some((c) => c.href === currentPath);
}
