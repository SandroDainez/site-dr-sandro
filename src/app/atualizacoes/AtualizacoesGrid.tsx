"use client";

import { useState } from "react";
import type { AtualizacaoData } from "@/lib/content";

type Props = {
  atualizacoes: AtualizacaoData[];
};

type FilterArea = "todas" | AtualizacaoData["area"];

const tabs: { value: FilterArea; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "emergencias", label: "Emergências" },
  { value: "ti", label: "TI" },
  { value: "anestesiologia", label: "Anestesiologia" },
];

const areaBadge: Record<AtualizacaoData["area"], string> = {
  emergencias: "bg-red-400/15 text-red-400 border-red-400/30",
  ti: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  anestesiologia: "bg-violet-400/15 text-violet-400 border-violet-400/30",
};

const areaLabel: Record<AtualizacaoData["area"], string> = {
  emergencias: "Emergências",
  ti: "Terapia Intensiva",
  anestesiologia: "Anestesiologia",
};

function formatDate(iso: string): string {
  try {
    const [year, month, day] = iso.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AtualizacoesGrid({ atualizacoes }: Props) {
  const [active, setActive] = useState<FilterArea>("todas");

  const sorted = [...atualizacoes].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const filtered =
    active === "todas" ? sorted : sorted.filter((a) => a.area === active);

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

      {filtered.length === 0 && (
        <p className="text-sm text-white/40">Nenhuma atualização nesta área ainda.</p>
      )}

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-0.5 hover:border-white/20"
          >
            {/* Area badge */}
            <span
              className={`self-start rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${areaBadge[item.area]}`}
            >
              {areaLabel[item.area]}
            </span>

            {/* Image */}
            {item.imageUrl && (
              <div className="mt-4">
                <img
                  src={item.imageUrl}
                  alt={item.imageCaption || item.titulo}
                  className="w-full rounded-2xl object-cover max-h-44"
                />
                {item.imageCaption && (
                  <p className="mt-1.5 text-xs text-white/40 leading-relaxed">
                    {item.imageCaption}
                  </p>
                )}
              </div>
            )}

            {/* Date */}
            <p className="mt-4 text-xs text-white/40">{formatDate(item.data)}</p>

            {/* Title */}
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white leading-snug">
              {item.titulo}
            </h2>

            {/* Content */}
            <p className="mt-3 text-sm leading-relaxed text-white/60 line-clamp-3 flex-1">
              {item.conteudo}
            </p>

            {/* External link */}
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent/80 transition hover:text-accent"
              >
                Ver fonte →
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
