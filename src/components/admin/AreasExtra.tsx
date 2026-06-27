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

  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-white/40">
        Também aparece em <span className="normal-case text-white/30">(opcional — além da especialidade principal)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {AREAS.map((a) => {
          const isPrimary = primary === a.value;
          const checked = set.has(a.value);
          if (isPrimary) {
            return (
              <span key={a.value} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/35">
                {a.label} <span className="text-white/25">· principal</span>
              </span>
            );
          }
          return (
            <button
              key={a.value}
              type="button"
              onClick={() => toggle(a.value)}
              aria-pressed={checked}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                checked
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {checked ? "✓ " : ""}{a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
