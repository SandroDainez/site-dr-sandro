"use client";

import { useState } from "react";
import type { AtualizacaoData } from "@/lib/content";

type Props = {
  atualizacoes: AtualizacaoData[];
  initialArea?: string;
};

type FilterArea = "todas" | AtualizacaoData["area"];

const tabs: { value: FilterArea; label: string }[] = [
  { value: "todas", label: "📋 Todas" },
  { value: "emergencias", label: "🚑 Emergências" },
  { value: "ti", label: "🏥 Terapia Intensiva" },
  { value: "anestesiologia", label: "🩺 Anestesiologia" },
];

const areaConfig = {
  emergencias: {
    label: "🚑 Emergências",
    badge: "bg-red-400/15 text-red-400 border-red-400/30",
    border: "border-red-400/25",
    sectionTitle: "text-red-400",
  },
  ti: {
    label: "🏥 Terapia Intensiva",
    badge: "bg-blue-400/15 text-blue-400 border-blue-400/30",
    border: "border-blue-400/25",
    sectionTitle: "text-blue-400",
  },
  anestesiologia: {
    label: "🩺 Anestesiologia",
    badge: "bg-violet-400/15 text-violet-400 border-violet-400/30",
    border: "border-violet-400/25",
    sectionTitle: "text-violet-400",
  },
};

const ALL_AREAS: AtualizacaoData["area"][] = ["emergencias", "ti", "anestesiologia"];

function formatDate(iso: string): string {
  try {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function UpdateCard({ item }: { item: AtualizacaoData }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = areaConfig[item.area];
  const isLong = item.conteudo.length > 250;
  const display = expanded || !isLong ? item.conteudo : item.conteudo.slice(0, 200) + "…";

  return (
    <article className={`rounded-2xl border ${cfg.border} bg-white/[0.03] p-5 transition hover:border-white/15`}>
      {/* Top: badge + date */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${cfg.badge}`}>
          {cfg.label}
        </span>
        <span className="text-[11px] text-white/35">{formatDate(item.data)}</span>
      </div>

      {/* Title */}
      <h2 className="text-[15px] font-semibold text-white leading-snug">
        {item.titulo}
      </h2>

      {/* Content */}
      <div className="mt-1.5 text-sm leading-relaxed text-white/60">
        {display}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="ml-1 text-accent/60 hover:text-accent transition text-xs whitespace-nowrap"
          >
            {expanded ? "[mostrar menos]" : "[continuar lendo]"}
          </button>
        )}
      </div>

      {/* Link + footer */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-accent/70 hover:text-accent transition font-medium"
          >
            🔗 Ver fonte →
          </a>
        )}
      </div>
    </article>
  );
}

function SectionHeader({
  area,
  count,
}: {
  area: AtualizacaoData["area"];
  count: number;
}) {
  const cfg = areaConfig[area];
  const labels: Record<typeof area, string> = {
    emergencias: "Emergências",
    ti: "Terapia Intensiva",
    anestesiologia: "Anestesiologia",
  };
  return (
    <div className={`flex items-center gap-2 ${cfg.sectionTitle} text-xs font-bold uppercase tracking-[0.15em]`}>
      {cfg.label.split(" ")[0]} {labels[area]}
    </div>
  );
}

export default function AtualizacoesGrid({ atualizacoes, initialArea }: Props) {
  const validAreas: FilterArea[] = ["todas", "emergencias", "ti", "anestesiologia"];
  const init: FilterArea = validAreas.includes(initialArea as FilterArea)
    ? (initialArea as FilterArea)
    : "todas";
  const [active, setActive] = useState<FilterArea>(init);

  // Sort all by date desc
  const sorted = [...atualizacoes].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  // Group by area while preserving sort order within each group
  const grouped: Record<AtualizacaoData["area"], AtualizacaoData[]> = {
    emergencias: [],
    ti: [],
    anestesiologia: [],
  };
  for (const item of sorted) {
    grouped[item.area].push(item);
  }

  // Which areas to show
  const areasToShow = ALL_AREAS.filter((area) => {
    if (grouped[area].length === 0) return false;
    if (active === "todas") return true;
    return area === active;
  });

  const hasAny = areasToShow.length > 0;

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActive(tab.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              active === tab.value
                ? "border-accent bg-accent/15 text-accent"
                : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!hasAny && (
        <p className="text-sm text-white/40 text-center py-12">
          Nenhuma atualização nesta área ainda.
        </p>
      )}

      {/* Cards grouped by area, one below another */}
      <div className="flex flex-col gap-8">
        {areasToShow.map((area) => (
          <section key={area}>
            <div className="mb-3">
              <SectionHeader area={area} count={grouped[area].length} />
            </div>
            <div className="flex flex-col gap-4">
              {grouped[area].map((item) => (
                <UpdateCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
