"use client";

import { useState } from "react";
import type { AtualizacaoData } from "@/lib/content";

type Props = {
  atualizacoes: AtualizacaoData[];
};

type FilterArea = "todas" | AtualizacaoData["area"];

const tabs: { value: FilterArea; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "emergencias", label: "🚑 Emergências" },
  { value: "ti", label: "🏥 Terapia Intensiva" },
  { value: "anestesiologia", label: "🩺 Anestesiologia" },
];

const areaConfig: Record<AtualizacaoData["area"], { label: string; badge: string }> = {
  emergencias: { label: "🚑 Emergências", badge: "bg-red-400/15 text-red-400 border-red-400/30" },
  ti: { label: "🏥 Terapia Intensiva", badge: "bg-blue-400/15 text-blue-400 border-blue-400/30" },
  anestesiologia: { label: "🩺 Anestesiologia", badge: "bg-violet-400/15 text-violet-400 border-violet-400/30" },
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

function Card({ item }: { item: AtualizacaoData }) {
  const [expanded, setExpanded] = useState(false);
  const config = areaConfig[item.area];
  const preview = item.conteudo.split(". ").slice(0, 2).join(". ") + ".";
  const isLong = item.conteudo.length > 200 || item.conteudo.split(".").length > 3;

  return (
    <article className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-white/20">
      {/* Area + Date row */}
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${config.badge}`}>
          {config.label}
        </span>
        <span className="text-[11px] text-white/30 whitespace-nowrap">{formatDate(item.data)}</span>
      </div>

      {/* Image */}
      {item.imageUrl && (
        <div className="mt-3">
          <img src={item.imageUrl} alt={item.imageCaption || item.titulo} className="w-full rounded-2xl object-cover max-h-36" />
          {item.imageCaption && <p className="mt-1 text-xs text-white/40 leading-relaxed">{item.imageCaption}</p>}
        </div>
      )}

      {/* Title */}
      <h2 className="mt-3 text-base font-semibold tracking-tight text-white leading-snug">
        {item.titulo}
      </h2>

      {/* Content with expand */}
      <div className="mt-2 text-sm leading-relaxed text-white/60">
        {expanded || !isLong ? (
          <p>{item.conteudo}</p>
        ) : (
          <p>{preview}</p>
        )}
      </div>

      {/* Actions row */}
      <div className="mt-auto pt-3 flex items-center gap-3">
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent/80 transition hover:text-accent"
          >
            Ver fonte →
          </a>
        )}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="ml-auto text-xs text-white/40 transition hover:text-white/70"
          >
            {expanded ? "▲ Mostrar menos" : "▼ Ler mais"}
          </button>
        )}
      </div>
    </article>
  );
}

export default function AtualizacoesGrid({ atualizacoes }: Props) {
  const [active, setActive] = useState<FilterArea>("todas");

  const sorted = [...atualizacoes].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const filtered = active === "todas" ? sorted : sorted.filter((a) => a.area === active);

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
          <Card key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
