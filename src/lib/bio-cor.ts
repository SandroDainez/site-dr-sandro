// Cores de destaque da caixa "Sobre o profissional" (cards de parceiros).
// Classes precisam ser literais completos p/ o Tailwind gerá-las.
export type BioCor = { box: string; head: string; label: string };

export const BIO_CORES: Record<string, BioCor> = {
  neutro:   { box: "border-white/10 bg-white/[0.02]", head: "text-white/40", label: "Neutro (padrão)" },
  teal:     { box: "border-accent/35 bg-accent/[0.07]", head: "text-accent", label: "Teal (marca)" },
  verde:    { box: "border-anest/35 bg-anest/[0.07]", head: "text-anest", label: "Verde" },
  azul:     { box: "border-inten/35 bg-inten/[0.07]", head: "text-inten", label: "Azul" },
  vermelho: { box: "border-emerg/35 bg-emerg/[0.07]", head: "text-emerg", label: "Vermelho" },
  violeta:  { box: "border-accent-violet/35 bg-accent-violet/[0.07]", head: "text-accent-violet", label: "Violeta" },
  ambar:    { box: "border-amber-400/35 bg-amber-400/[0.07]", head: "text-amber-400", label: "Âmbar" },
};

export const BIO_CORES_LISTA = Object.entries(BIO_CORES).map(([value, c]) => ({ value, label: c.label }));

export function bioCorTema(cor?: string): BioCor {
  return BIO_CORES[cor ?? "neutro"] ?? BIO_CORES.neutro;
}
