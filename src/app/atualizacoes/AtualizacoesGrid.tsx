"use client";

import { useState } from "react";
import type { AtualizacaoData } from "@/lib/content";

type Props = {
  atualizacoes: AtualizacaoData[];
};

type FilterArea = "todas" | AtualizacaoData["area"];

const tabs: { value: FilterArea; label: string }[] = [
  { value: "todas", label: "📋 Todas" },
  { value: "emergencias", label: "🚑 Emergências" },
  { value: "ti", label: "🏥 Terapia Intensiva" },
  { value: "anestesiologia", label: "🩺 Anestesiologia" },
];

const areaConfig: Record<AtualizacaoData["area"], { label: string; color: string; border: string; bg: string }> = {
  emergencias: {
    label: "🚑 Emergências",
    color: "text-red-400",
    border: "border-red-400/25",
    bg: "bg-red-400/[0.02]",
  },
  ti: {
    label: "🏥 Terapia Intensiva",
    color: "text-blue-400",
    border: "border-blue-400/25",
    bg: "bg-blue-400/[0.02]",
  },
  anestesiologia: {
    label: "🩺 Anestesiologia",
    color: "text-violet-400",
    border: "border-violet-400/25",
    bg: "bg-violet-400/[0.02]",
  },
};

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

function TopicCard({ item }: { item: AtualizacaoData }) {
  const [expanded, setExpanded] = useState(false);
  const preview = item.conteudo.split(". ").slice(0, 2).join(". ") + ".";
  const isLong = item.conteudo.length > 200 || item.conteudo.split(".").length > 3;

  return (
    <div className="border-t border-white/[0.06] pt-4 first:border-0 first:pt-0">
      {/* Título */}
      <h3 className="text-[15px] font-semibold text-white leading-snug">
        {item.titulo}
      </h3>

      {/* Conteúdo com expandir/recolher */}
      <div className="mt-1.5 text-sm leading-relaxed text-white/60">
        {expanded || !isLong ? (
          <p>{item.conteudo}</p>
        ) : (
          <p>{preview}</p>
        )}
      </div>

      {/* Link + expandir na mesma linha */}
      <div className="mt-2 flex items-center gap-3">
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent/80 hover:text-accent transition"
          >
            🔗 Ver fonte →
          </a>
        )}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-white/30 hover:text-white/60 transition"
          >
            {expanded ? "▲ Recolher" : "▼ Ler mais"}
          </button>
        )}
      </div>
    </div>
  );
}

function AreaBoletimCard({
  area,
  items,
}: {
  area: AtualizacaoData["area"];
  items: AtualizacaoData[];
}) {
  const cfg = areaConfig[area];
  const latestDate = items[0]?.data;

  return (
    <div
      className={`rounded-3xl border ${cfg.border} ${cfg.bg} p-6 transition hover:-translate-y-0.5 hover:border-white/20`}
    >
      {/* Cabeçalho da área */}
      <div className="flex items-center justify-between mb-5">
        <span className={`text-sm font-bold uppercase tracking-[0.12em] ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className="text-[11px] text-white/30">{formatDate(latestDate)}</span>
      </div>

      {/* Tópicos */}
      <div className="space-y-4">
        {items.map((item) => (
          <TopicCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function AtualizacoesGrid({ atualizacoes }: Props) {
  const [active, setActive] = useState<FilterArea>("todas");

  // Sort by date descending
  const sorted = [...atualizacoes].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  // Group by area, take top 3 per area
  const grouped: Record<AtualizacaoData["area"], AtualizacaoData[]> = {
    emergencias: [],
    ti: [],
    anestesiologia: [],
  };

  for (const item of sorted) {
    if (grouped[item.area].length < 3) {
      grouped[item.area].push(item);
    }
  }

  const areas: AtualizacaoData["area"][] = ["emergencias", "ti", "anestesiologia"];

  // Determine which areas to show
  const filteredAreas =
    active === "todas"
      ? areas
      : areas.filter((a) => a === active);

  const hasContent = filteredAreas.some((a) => grouped[a].length > 0);

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

      {!hasContent && (
        <p className="text-sm text-white/40">Nenhuma atualização nesta área ainda.</p>
      )}

      {/* Boletim cards — 1 card por área */}
      <div className="grid gap-6 lg:grid-cols-3">
        {filteredAreas.map((area) => {
          const items = grouped[area];
          if (items.length === 0) return null;
          return <AreaBoletimCard key={area} area={area} items={items} />;
        })}
      </div>

      {/* Se alguma área ficou de fora por ter menos de 3 itens, mostra sutil */}
      {active === "todas" && sorted.length > 0 && (
        <p className="mt-6 text-xs text-white/20 text-center">
          Últimas 3 atualizações por área • {sorted.length} no total
        </p>
      )}
    </div>
  );
}
