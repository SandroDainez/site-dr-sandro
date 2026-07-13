"use client";

import { useState } from "react";
import type { AtualizacaoData } from "@/lib/content";
import BoletimCard, { type BoletimUpdate } from "./BoletimCard";
import { UpdateCard } from "@/app/atualizacoes/AtualizacoesGrid";
import { colStyle } from "@/lib/card-grid";

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
const siteToEsp = (a: string): string => (a === "ti" ? "terapia_intensiva" : a);

// Uma atualização manual no "formato boletim" tem resumo/tópicos como a da IA.
function isBoletimManual(m: AtualizacaoData): boolean {
  return m.formato === "boletim" && ((m.topicos?.length ?? 0) > 0 || !!m.resumo);
}
// Normaliza a manual para o mesmo shape que BoletimCard/UpdateContent consomem.
function manualParaBoletim(m: AtualizacaoData) {
  return {
    id: m.id,
    titulo: m.titulo,
    resumo: m.resumo ?? "",
    topicos: m.topicos ?? [],
    fontes: m.fontes ?? [],
    especialidade: siteToEsp(m.area),
    semana_referencia: "",
    data_publicacao: m.data,
  };
}

type Item =
  | { kind: "ai"; date: string; area: string; raw: BoletimUpdate }
  | { kind: "manual"; date: string; area: string; areas?: string[]; raw: AtualizacaoData };

export default function AtualizacoesFeed({
  ai = [],
  manuais = [],
  showTabs = false,
  limit,
  initialArea = "todas",
  controlledArea,
  logos = {},
  cols = 3,
}: {
  ai?: BoletimUpdate[];
  manuais?: AtualizacaoData[];
  showTabs?: boolean;
  limit?: number;
  initialArea?: string;
  // Quando fornecido, o feed é filtrado por esta área (vinda de um filtro externo,
  // ex.: o filtro de área da zona /atualizar) e NÃO mostra as próprias abas.
  controlledArea?: string;
  logos?: Record<string, { logoUrl?: string; emoji?: string }>;
  cols?: number;
}) {
  const valid = TABS.some((t) => t.value === initialArea) ? (initialArea as Area) : "todas";
  const [areaState, setArea] = useState<Area>(valid);
  const controlada = controlledArea != null;
  const area: Area = controlada
    ? (TABS.some((t) => t.value === controlledArea) ? (controlledArea as Area) : "todas")
    : areaState;
  const abasVisiveis = showTabs && !controlada;
  const filtrarPorArea = area !== "todas" && (showTabs || controlada);

  // Só o boletim MAIS RECENTE por especialidade no feed — as semanas anteriores
  // ficam no histórico (/atualizacoes-semanais). Evita "novo + velho" da mesma área.
  const aiRecentes: BoletimUpdate[] = [];
  const vistos = new Set<string>();
  for (const u of [...ai].sort((a, b) => String(b.data_publicacao ?? "").localeCompare(String(a.data_publicacao ?? "")))) {
    const esp = String(u.especialidade ?? "");
    if (vistos.has(esp)) continue;
    vistos.add(esp);
    aiRecentes.push(u);
  }

  // Dedup defensivo das manuais por id (dado duplicado no blob gerava cards repetidos
  // e colisão de key no React — só o primeiro respondia ao clique).
  const manuaisUnicas: AtualizacaoData[] = [];
  const idsVistos = new Set<string>();
  for (const m of manuais) {
    if (!m.titulo) continue;
    const chave = String(m.id ?? `${m.titulo}-${m.data ?? ""}`);
    if (idsVistos.has(chave)) continue;
    idsVistos.add(chave);
    manuaisUnicas.push(m);
  }

  const items: Item[] = [
    ...aiRecentes.map((u) => ({ kind: "ai" as const, date: (u.data_publicacao ?? "").slice(0, 10), area: espToSite(u.especialidade ?? ""), raw: u })),
    ...manuaisUnicas.map((m) => ({ kind: "manual" as const, date: m.data ?? "", area: m.area, areas: m.areas, raw: m })),
  ];

  const filtered = filtrarPorArea
    ? items.filter((it) => it.area === area || (it.kind === "manual" && it.areas?.includes(area)))
    : items;

  filtered.sort((a, b) => b.date.localeCompare(a.date));
  const shown = limit ? filtered.slice(0, limit) : filtered;

  return (
    <div>
      {abasVisiveis && (
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
        <div className="card-grid items-start gap-5" style={colStyle(cols)}>
          {shown.map((it) =>
            it.kind === "ai"
              ? <BoletimCard key={`ai-${it.raw.id}`} update={it.raw} logo={logos[it.area]} />
              : isBoletimManual(it.raw)
                ? <BoletimCard key={`m-${it.raw.id}`} update={manualParaBoletim(it.raw)} manual logo={logos[it.area]} />
                : <UpdateCard key={`m-${it.raw.id}`} item={it.raw} />
          )}
        </div>
      )}

      {/* Arquivo: cada semana entra um boletim novo; os anteriores ficam guardados. */}
      {ai.length > 0 && (
        <div className="mt-6 text-center">
          <a
            href={`/atualizacoes-semanais${area !== "todas" ? `?area=${area}` : ""}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/[0.06] px-4 py-2 text-sm font-medium text-accent transition hover:border-accent/60 hover:bg-accent/10"
          >
            Ver semanas anteriores (histórico de boletins) →
          </a>
        </div>
      )}
    </div>
  );
}
