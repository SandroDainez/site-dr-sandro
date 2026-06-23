// Constantes de tipografia — SEM imports de Node (fs/path), para poder ser
// usado tanto no servidor (content.ts) quanto em componentes client
// (TypographyEditor) sem arrastar o `fs` para o bundle do navegador.

// Mapa: chave da seção → escala (1 = normal, 1.2 = 20% maior, 0.9 = 10% menor).
export type TypographyData = Record<string, number>;

// Seções editáveis na home, na ordem em que aparecem no site.
export const TYPOGRAPHY_SECTIONS: { key: string; label: string }[] = [
  { key: "header", label: "Cabeçalho (nome, CRM, RQE)" },
  { key: "hero", label: "Hero (destaque principal)" },
  { key: "marquee", label: "Faixa rolante (marquee)" },
  { key: "apps", label: "Apps por assinatura" },
  { key: "freeApps", label: "Apps grátis" },
  { key: "atualizacoes", label: "Atualizações (home)" },
  { key: "protocolos", label: "Protocolos (home)" },
  { key: "videoaulas", label: "Videoaulas (home)" },
  { key: "cursos", label: "Cursos" },
  { key: "eventos", label: "Eventos / calendário" },
  { key: "contato", label: "Contato" },
  { key: "whyUs", label: "Por que nós" },
  { key: "footer", label: "Rodapé" },
];
