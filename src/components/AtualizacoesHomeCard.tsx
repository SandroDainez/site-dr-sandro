"use client";

import { useState } from "react";
import type { AtualizacaoData } from "@/lib/content";

const areaConfig: Record<AtualizacaoData["area"], { label: string; color: string; border: string }> = {
  emergencias: { label: "🚑 Emergências", color: "text-red-400", border: "border-red-400/30" },
  ti: { label: "🏥 Terapia Intensiva", color: "text-blue-400", border: "border-blue-400/30" },
  anestesiologia: { label: "🩺 Anestesiologia", color: "text-violet-400", border: "border-violet-400/30" },
};

function formatDate(iso: string): string {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

export function AtualizacoesHomeCard({ item }: { item: AtualizacaoData }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = areaConfig[item.area];
  const preview = item.conteudo.split(". ").slice(0, 2).join(". ") + ".";
  const isLong = item.conteudo.length > 180 || item.conteudo.split(".").length > 3;

  return (
    <div className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${cfg.color}`}>{cfg.label}</span>
        <span className="text-[10px] text-white/30">{formatDate(item.data)}</span>
      </div>
      <h3 className="text-sm font-semibold text-white leading-snug">{item.titulo}</h3>
      <p className="mt-1 text-xs leading-relaxed text-white/50">
        {expanded || !isLong ? item.conteudo : preview}
      </p>
      <div className="flex items-center gap-3 mt-2">
        {item.link && (
          <a href={item.link} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-accent/80 hover:text-accent">
            Ver fonte →
          </a>
        )}
        {isLong && (
          <button type="button" onClick={() => setExpanded(!expanded)} className="text-[11px] text-white/30 hover:text-white/60">
            {expanded ? "▲ menos" : "▼ mais"}
          </button>
        )}
      </div>
    </div>
  );
}
