"use client";

import { useState } from "react";
import type { AtualizacaoData } from "@/lib/content";
import BoletimCard from "./BoletimCard";
import { UpdateCard } from "@/app/atualizacoes/AtualizacoesGrid";

// Feed ÚNICO de Atualizações clínicas: boletins automáticos da IA (medical_updates)
// + atualizações manuais (AtualizacaoData), juntos e em ordem cronológica.

type Area = "todas" | "emergencias" | "ti" | "anestesiologia";
const TABS: { value: Area; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "emergencias", label: "🚑 Emergências" },
  { value: "ti", label: "🏥 Terapia Intensiva" },
  { value: "anestesiologia", label: "🩺 Anestesiologia" },
];

const espToSite = (e: string): string => (e === "terapia_intensiva" ? "ti" : e);

type Item =
  | { kind: "ai"; date: string; area: string; raw: any }
  | { kind: "manual"; date: string; area: string; areas?: string[]; raw: AtualizacaoData };

export default function AtualizacoesFeed({
  ai = [],
  manuais = [],
  showTabs = false,
  limit,
  initialArea = "todas",
}: {
  ai?: any[];
  manuais?: AtualizacaoData[];
  showTabs?: boolean;
  limit?: number;
  initialArea?: string;
}) {
  const valid = TABS.some((t) => t.value === initialArea) ? (initialArea as Area) : "todas";
  const [area, setArea] = useState<Area>(valid);

  const items: Item[] = [
    ...ai.map((u) => ({ kind: "ai" as const, date: (u.data_publicacao ?? "").slice(0, 10), area: espToSite(u.especialidade), raw: u })),
    ...manuais.filter((m) => m.titulo).map((m) => ({ kind: "manual" as const, date: m.data ?? "", area: m.area, areas: m.areas, raw: m })),
  ];

  const filtered = showTabs && area !== "todas"
    ? items.filter((it) => it.area === area || (it.kind === "manual" && it.areas?.includes(area)))
    : items;

  filtered.sort((a, b) => b.date.localeCompare(a.date));
  const shown = limit ? filtered.slice(0, limit) : filtered;

  return (
    <div>
      {showTabs && (
        <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setArea(t.value)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${area === t.value ? "border-accent/50 bg-accent/15 text-accent" : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
          <p className="text-sm text-white/50">Nenhuma atualização ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {shown.map((it) =>
            it.kind === "ai"
              ? <BoletimCard key={`ai-${it.raw.id}`} update={it.raw} />
              : <UpdateCard key={`m-${it.raw.id}`} item={it.raw} />
          )}
        </div>
      )}
    </div>
  );
}
