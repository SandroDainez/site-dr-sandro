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
  { slug: "aberto",   href: "/aberto",   label: "Aberto",        papel: "podcast · extras", cor: "#ff9d4d" },
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

// Um item pertence à área ativa se sua área principal bate OU está nas áreas extras.
// "todos" mostra tudo. "geral"/sem área aparece em qualquer filtro (transversal).
export function itemNaArea(item: { area?: string; areas?: string[] }, area: AreaFiltro): boolean {
  if (area === "todos") return true;
  if (!item.area || item.area === "geral") return true;
  return item.area === area || (item.areas?.includes(area) ?? false);
}
