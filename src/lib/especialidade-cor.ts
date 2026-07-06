// Temas de cor das especialidades. As classes precisam aparecer como LITERAIS
// completos aqui para o Tailwind gerá-las (não pode montar `from-${cor}` dinâmico).
export type CorTema = {
  grad: string;
  accent: string;
  border: string;
  badge: string;
  label: string; // rótulo p/ o select do admin
};

export const CORES_ESPECIALIDADE: Record<string, CorTema> = {
  emerg: { grad: "from-emerg/25 via-emerg/8", accent: "text-emerg", border: "hover:border-emerg/50", badge: "bg-emerg/15 text-emerg border-emerg/30", label: "Vermelho (Emergência)" },
  inten: { grad: "from-inten/25 via-inten/8", accent: "text-inten", border: "hover:border-inten/50", badge: "bg-inten/15 text-inten border-inten/30", label: "Azul (Terapia Intensiva)" },
  anest: { grad: "from-anest/25 via-anest/8", accent: "text-anest", border: "hover:border-anest/50", badge: "bg-anest/15 text-anest border-anest/30", label: "Verde (Anestesiologia)" },
  accent: { grad: "from-accent/25 via-accent/8", accent: "text-accent", border: "hover:border-accent/50", badge: "bg-accent/15 text-accent border-accent/30", label: "Teal (marca)" },
  blue: { grad: "from-accent-blue/25 via-accent-blue/8", accent: "text-accent-blue", border: "hover:border-accent-blue/50", badge: "bg-accent-blue/15 text-accent-blue border-accent-blue/30", label: "Azul-claro" },
  violet: { grad: "from-accent-violet/25 via-accent-violet/8", accent: "text-accent-violet", border: "hover:border-accent-violet/50", badge: "bg-accent-violet/15 text-accent-violet border-accent-violet/30", label: "Violeta" },
};

export const CORES_LISTA = Object.entries(CORES_ESPECIALIDADE).map(([value, t]) => ({ value, label: t.label }));

export function corTema(cor?: string): CorTema {
  return CORES_ESPECIALIDADE[cor ?? "accent"] ?? CORES_ESPECIALIDADE.accent;
}
