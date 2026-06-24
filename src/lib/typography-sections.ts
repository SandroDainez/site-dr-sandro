// Motor de tipografia por seção — SEM imports de Node (fs/path), para poder ser
// usado tanto no servidor (content.ts / page.tsx) quanto em componentes client
// (painéis do admin) sem arrastar o `fs` para o bundle do navegador.

// Estilo de uma seção. Tudo opcional: o que não for definido mantém o original.
export type SectionStyle = {
  scale?: number; // 0.8–1.4 (1 = tamanho normal) → aplicado via CSS zoom
  font?: string; // chave de FONT_OPTIONS
  color?: string; // cor das letras (hex)
  weight?: number; // 300–800
};

// Mapa: chave da seção → estilo. Aceita number (formato antigo = só escala).
export type TypographyData = Record<string, SectionStyle | number>;

// Seções editáveis na home, na ordem em que aparecem no site.
export const TYPOGRAPHY_SECTIONS: { key: string; label: string }[] = [
  { key: "header", label: "Cabeçalho (nome, CRM, RQE)" },
  { key: "nav", label: "Menu (navegação)" },
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

// Fontes disponíveis (carregadas em layout.tsx via next/font).
export const FONT_OPTIONS: { key: string; label: string; stack: string }[] = [
  { key: "", label: "Padrão (Geist)", stack: "var(--font-geist-sans), system-ui, sans-serif" },
  { key: "inter", label: "Inter (moderna)", stack: "var(--font-inter), system-ui, sans-serif" },
  { key: "poppins", label: "Poppins (display)", stack: "var(--font-poppins), system-ui, sans-serif" },
  { key: "lora", label: "Lora (serifada)", stack: "var(--font-lora), Georgia, serif" },
  { key: "mono", label: "Mono (monoespaçada)", stack: "var(--font-geist-mono), ui-monospace, monospace" },
  { key: "system", label: "Sistema", stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
];

export const WEIGHT_OPTIONS: { value: number; label: string }[] = [
  { value: 300, label: "Leve" },
  { value: 400, label: "Normal" },
  { value: 500, label: "Médio" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Negrito" },
  { value: 800, label: "Extra" },
];

// Normaliza o valor salvo (number antigo ou objeto) para SectionStyle.
export function normalizeStyle(v: SectionStyle | number | undefined): SectionStyle {
  if (v == null) return {};
  if (typeof v === "number") return { scale: v };
  return v;
}

function fontStack(key: string | undefined): string | null {
  if (!key) return null;
  const found = FONT_OPTIONS.find((f) => f.key === key);
  return found && found.key ? found.stack : null;
}

function safeColor(c: string | undefined): string | null {
  if (!c) return null;
  return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : null;
}

// Gera o CSS escopado por seção. Usa data-typo="<chave>" no wrapper de cada seção.
// `!important` garante que cor/fonte/peso vençam as classes utilitárias do Tailwind.
export function buildTypographyCss(data: TypographyData | undefined): string {
  if (!data) return "";
  const rules: string[] = [];
  for (const section of TYPOGRAPHY_SECTIONS) {
    const s = normalizeStyle(data[section.key]);
    const sel = `[data-typo="${section.key}"]`;

    if (s.scale && s.scale !== 1) {
      rules.push(`${sel}{zoom:${s.scale}}`);
    }

    const decls: string[] = [];
    const stack = fontStack(s.font);
    if (stack) decls.push(`font-family:${stack} !important`);
    const color = safeColor(s.color);
    if (color) decls.push(`color:${color} !important`);
    if (s.weight) decls.push(`font-weight:${s.weight} !important`);

    if (decls.length) {
      // aplica à seção e a todos os textos dentro dela
      rules.push(`${sel},${sel} *{${decls.join(";")}}`);
    }
  }
  return rules.join("\n");
}
