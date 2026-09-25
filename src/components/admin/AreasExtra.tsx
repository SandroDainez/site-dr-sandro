"use client";

// Seletor de especialidades EXTRAS para multi-especialidade: além da área
// principal, o conteúdo também aparece nos hubs marcados aqui.
type Area = "emergencias" | "ti" | "anestesiologia";

const AREAS: { value: Area; label: string }[] = [
  { value: "emergencias", label: "🚑 Emergências" },
  { value: "ti", label: "🏥 Terapia Intensiva" },
  { value: "anestesiologia", label: "🩺 Anestesiologia" },
];

export default function AreasExtra({
  value,
  primary,
  onChange,
}: {
  value?: string[];
  primary?: string; // área principal (já incluída) — fica desabilitada aqui
  onChange: (areas: Area[]) => void;
}) {
  const set = new Set((value ?? []) as Area[]);

  function toggle(a: Area) {
    const next = new Set(set);
    if (next.has(a)) next.delete(a);
    else next.add(a);
    onChange([...next]);
  }

  const extras = [...set].filter((a) => a !== primary).length;

  return (
    <div className="rounded-xl border border-accent/25 bg-accent/[0.04] p-4">
      <label className="mb-1 block text-sm font-semibold text-white">
        Em quais áreas este guia aparece
      </label>
      <p className="mb-3 text-xs text-white/50">
        A <strong className="text-white/70">principal</strong> (campo “Área” acima) já entra. Clique nas outras para o
        guia aparecer <strong className="text-white/70">também</strong> naqueles hubs. {extras > 0
          ? `Aparecendo em ${extras + 1} áreas.`
          : "Marque quantas quiser."}
      </p>
      <div className="flex flex-wrap gap-2">
        {AREAS.map((a) => {
          const isPrimary = primary === a.value;
          const checked = set.has(a.value);
          if (isPrimary) {
            return (
              <span key={a.value} className="rounded-full border border-accent/40 bg-accent/15 px-3.5 py-2 text-sm font-medium text-accent">
                {a.label} <span className="text-accent/70">· principal ✓</span>
              </span>
            );
          }
          return (
            <button
              key={a.value}
              type="button"
              onClick={() => toggle(a.value)}
              aria-pressed={checked}
              className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                checked
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-white/20 bg-white/[0.03] text-white/60 hover:border-white/40 hover:text-white"
              }`}
            >
              {checked ? "✓ " : "+ "}{a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
