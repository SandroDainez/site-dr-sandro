"use client";

import { useState } from "react";
import type { ProtocoloData } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";

type Props = {
  protocolos: ProtocoloData[];
};

type FilterArea = "todos" | ProtocoloData["area"];

const tabs: { value: FilterArea; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "emergencias", label: "Emergências" },
  { value: "ti", label: "TI" },
  { value: "anestesiologia", label: "Anestesiologia" },
];

const areaBadge: Record<ProtocoloData["area"], string> = {
  emergencias: "bg-red-400/15 text-red-400 border-red-400/30",
  ti: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  anestesiologia: "bg-violet-400/15 text-violet-400 border-violet-400/30",
};

const areaLabel: Record<ProtocoloData["area"], string> = {
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

export default function ProtocolosGrid({ protocolos }: Props) {
  const [active, setActive] = useState<FilterArea>("todos");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sorted = [...protocolos].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const filtered =
    active === "todos" ? sorted : sorted.filter((p) => p.area === active);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
        <p className="text-sm text-white/40">Nenhum protocolo nesta área ainda.</p>
      )}

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const isExpanded = expanded.has(item.id);
          return (
            <article
              key={item.id}
              className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20"
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

              {/* Descrição */}
              <p
                className="mt-3 text-sm leading-relaxed text-white/60 line-clamp-2 flex-1"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.descricao) }}
              />

              {/* Ver protocolo toggle */}
              {item.conteudo && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="text-xs font-medium text-accent/80 transition hover:text-accent"
                  >
                    {isExpanded ? "Fechar protocolo ↑" : "Ver protocolo ↓"}
                  </button>
                  {isExpanded && (
                    <pre
                      className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-white/70 font-mono"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.conteudo) }}
                    />
                  )}
                </div>
              )}

              {/* Arquivo link */}
              {item.arquivoUrl && (
                <a
                  href={item.arquivoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1 self-start rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/70 transition hover:border-accent/40 hover:text-white"
                >
                  {item.arquivoLabel || "Ver arquivo"} →
                </a>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
