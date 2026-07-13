"use client";

import { AREAS_FILTRO, type AreaFiltro } from "@/lib/zonas";

// Filtro de ESPECIALIDADE (2º eixo) que atravessa as zonas. "Tudo" é o padrão.
// Controlado pelo pai (a view da zona) — guarda o estado e filtra o conteúdo.
export default function FiltroArea({ value, onChange }: { value: AreaFiltro; onChange: (a: AreaFiltro) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Área</span>
      {AREAS_FILTRO.map((a) => {
        const on = a.valor === value;
        return (
          <button
            key={a.valor}
            type="button"
            onClick={() => onChange(a.valor)}
            aria-pressed={on}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              on
                ? "border-accent bg-accent/15 text-accent"
                : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
