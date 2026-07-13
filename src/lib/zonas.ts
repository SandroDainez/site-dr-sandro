// As 6 zonas da reestruturação (ver plano Tier 0). Eixo "o que você quer fazer agora".
// Fonte única — a navegação e as páginas de zona leem daqui. A ÁREA (especialidade) é um
// segundo eixo, ortogonal, tratado por FiltroArea.

export type ZonaSlug = "plantao" | "aprender" | "atualizar" | "treinar" | "meu" | "aberto";

export type Zona = {
  slug: ZonaSlug;
  href: string;
  label: string;
  papel: string; // 1 linha: pra que serve
  cor: string;   // hex do acento da zona
};

export const ZONAS: Zona[] = [
  { slug: "plantao",  href: "/plantao",  label: "Plantão",       papel: "apoio na hora", cor: "#ff6259" },
  { slug: "aprender", href: "/aprender", label: "Aprender",      papel: "formação",      cor: "#5b9dff" },
  { slug: "atualizar",href: "/atualizar",label: "Atualizar",     papel: "o que há de novo", cor: "#b98af0" },
  { slug: "treinar",  href: "/treinar",  label: "Treinar",       papel: "testar-se",     cor: "#2ce6b8" },
  { slug: "aberto",   href: "/aberto",   label: "Extras",        papel: "podcast · curiosidades · IA", cor: "#ff9d4d" },
  { slug: "meu",      href: "/minha-area", label: "Meu MedCampus", papel: "perfil · assinatura", cor: "#e8b84a" },
];

export function getZona(slug: ZonaSlug): Zona {
  return ZONAS.find((z) => z.slug === slug)!;
}

// Áreas (especialidades) do filtro que atravessa as zonas. "todos" = vitrine/tudo.
export type AreaFiltro = "todos" | "emergencias" | "ti" | "anestesiologia";
export const AREAS_FILTRO: { valor: AreaFiltro; label: string }[] = [
  { valor: "todos", label: "Tudo" },
  { valor: "anestesiologia", label: "Anestesiologia" },
  { valor: "emergencias", label: "Emergências" },
  { valor: "ti", label: "Terapia Intensiva" },
];

// Deduz a área do site a partir de um texto livre de especialidade/credencial
// (ex.: "Anestesiologia", "Medicina Intensiva", "Emergência"). Usado como FALLBACK quando
// o campo "Área no site" não foi preenchido — assim conteúdo antigo (que só tem a credencial
// em texto) já filtra certo, sem re-marcar tudo à mão. Retorna undefined se não reconhecer.
export function areaDoTexto(texto?: string): AreaFiltro | undefined {
  if (!texto) return undefined;
  const t = texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (t.includes("anestesi")) return "anestesiologia";
  if (t.includes("emerg")) return "emergencias";
  if (t.includes("intensiv") || t.includes("terapia intensiva") || /\bti\b/.test(t)) return "ti";
  return undefined;
}

// Filtro de área. "Tudo" mostra tudo (inclusive o sem área/geral). Numa área ESPECÍFICA,
// só aparece o que foi marcado com ela (principal ou extra) — conteúdo "geral"/sem área
// NÃO polui as áreas específicas, fica só no "Tudo". Assunto de várias áreas = marcar cada
// uma (multi-área) para aparecer nelas.
export function itemNaArea(item: { area?: string; areas?: string[] }, area: AreaFiltro): boolean {
  if (area === "todos") return true;
  const principal = item.area && item.area !== "geral" ? item.area : null;
  return principal === area || (item.areas?.includes(area) ?? false);
}
