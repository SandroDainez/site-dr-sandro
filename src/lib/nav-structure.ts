// Estrutura fixa do menu principal: poucos botões, cada um agrupando os assuntos
// relacionados. Definida em código (estável). Os conteúdos de cada seção seguem
// editáveis no admin normalmente — o que é fixo aqui é só a montagem dos grupos.

export type NavLink = { label: string; href: string; emoji?: string };
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
  { label: "Todo o conteúdo", href: "/conteudo" },
  {
    label: "Apps",
    children: [
      { label: "Apps por assinatura", href: "#apps-assinatura" },
      { label: "Apps do dia a dia", href: "#apps-uteis" },
    ],
  },
  {
    label: "Sobre",
    children: [
      { label: "Colaboradores", href: "/colaboradores" },
      { label: "Eventos", href: "#eventos" },
      { label: "Contato", href: "#contato" },
    ],
  },
];

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
