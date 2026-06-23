"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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

const areaMeta: Record<
  AtualizacaoData["area"],
  { title: string; emoji: string; color: string; border: string; hoverBorder: string }
> = {
  emergencias: {
    title: "ATUALIZAÇÕES EM EMERGÊNCIAS",
    emoji: "🚑",
    color: "text-red-400",
    border: "border-red-400/25",
    hoverBorder: "hover:border-red-400/50",
  },
  ti: {
    title: "ATUALIZAÇÕES EM MEDICINA INTENSIVA",
    emoji: "🏥",
    color: "text-blue-400",
    border: "border-blue-400/25",
    hoverBorder: "hover:border-blue-400/50",
  },
  anestesiologia: {
    title: "ATUALIZAÇÕES EM ANESTESIOLOGIA",
    emoji: "🩺",
    color: "text-violet-400",
    border: "border-violet-400/25",
    hoverBorder: "hover:border-violet-400/50",
  },
};

function formatDateBR(iso: string): string {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    return `${d} de ${meses[m - 1]} de ${y}`;
  } catch {
    return iso;
  }
}

function Sep() {
  return (
    <div className="text-white/[0.07] text-center text-xs font-mono tracking-[0.5em] select-none leading-none my-4">
      {Array(20).fill("_").join("")}
    </div>
  );
}

function TopicBlock({
  item,
  index,
  areaColor,
}: {
  item: AtualizacaoData;
  index: number;
  areaColor: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const parts = item.conteudo.split(/(Aplicação prática[^.]*\.)/i);
  const mainContent = parts[0] || item.conteudo;
  const pratica = parts[1];

  const isLong = item.conteudo.length > 300;
  const displayContent = expanded || !isLong ? mainContent : mainContent.slice(0, 200) + "…";

  return (
    <div>
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-1.5 text-xs ${areaColor} opacity-70 hover:opacity-100 transition font-medium`}
        >
          🔗 {item.titulo}
        </a>
      )}

      <Sep />

      <div className="text-sm font-bold text-white leading-snug flex items-start gap-1.5">
        <span>📢</span>
        <span>
          <span className={areaColor}>{index + 1}.</span>{" "}
          {item.titulo}
        </span>
      </div>

      {item.imageUrl && (
        <div className="mt-3">
          <img
            src={item.imageUrl}
            alt={item.imageCaption || item.titulo}
            className="rounded-xl w-full max-h-60 object-cover border border-white/10"
          />
          {item.imageCaption && (
            <p className="mt-1.5 text-xs text-white/40 text-center">{item.imageCaption}</p>
          )}
        </div>
      )}

      <div className="mt-2 text-sm leading-relaxed text-white/65">
        <span className="opacity-60">📝</span>{" "}
        {displayContent}
        {isLong && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ml-1 text-accent/60 hover:text-accent transition text-xs"
          >
            [continuar lendo]
          </button>
        )}
        {isLong && expanded && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="ml-1 text-white/30 hover:text-white/50 transition text-xs"
          >
            [mostrar menos]
          </button>
        )}
      </div>

      {pratica && (
        <div className="mt-2 text-sm leading-relaxed text-white/65">
          <span className="opacity-60">💡</span>{" "}
          {pratica}
        </div>
      )}
    </div>
  );
}

function BoletimCard({
  area,
  items,
  defaultOpen,
}: {
  area: AtualizacaoData["area"];
  items: AtualizacaoData[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = areaMeta[area];

  const sorted = [...items].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );
  const latestDate = sorted[0]?.data || "";
  // Show top 3, rest in "Também"
  const visible = sorted.slice(0, 3);
  const extras = sorted.slice(3);

  return (
    <div className={`rounded-3xl border ${meta.border} ${meta.hoverBorder} bg-white/[0.03] transition`}>
      {/* ═══ HEADER (clicável) ═══ */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-6 sm:p-7 text-left"
      >
        <div>
          <div className={`text-sm font-black tracking-[0.15em] ${meta.color}`}>
            {meta.emoji} {meta.title}
          </div>
          <div className="text-xs text-white/40 mt-1">
            📆 {formatDateBR(latestDate)} · {items.length} atualização{items.length !== 1 ? "ões" : ""}
          </div>
        </div>
        <div className={`ml-4 shrink-0 rounded-full border border-white/10 p-1.5 ${meta.color} opacity-60`}>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* ═══ BODY (colapsável) ═══ */}
      {open && (
        <div className="px-6 pb-6 sm:px-7 sm:pb-7 border-t border-white/[0.06]">
          <div className="mt-5">
            {visible.map((item, idx) => (
              <div key={item.id}>
                <TopicBlock item={item} index={idx} areaColor={meta.color} />
                {idx < visible.length - 1 && <Sep />}
              </div>
            ))}
          </div>

          {extras.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
                <span>📕</span> Também:
              </div>
              <div className="mt-1.5 text-xs text-white/50 leading-relaxed">
                {extras.map((e, i) => (
                  <span key={e.id}>
                    {e.link ? (
                      <a href={e.link} target="_blank" rel="noreferrer" className="text-accent/70 hover:text-accent transition">
                        {e.titulo}
                      </a>
                    ) : (
                      e.titulo
                    )}
                    {i < extras.length - 1 && <span className="text-white/20 mx-1.5">|</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-xs text-white/25">
              <span>🤖</span>
              <span>Boletim gerado pelo Amigo 🦊 — {formatDateBR(latestDate)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ALL_AREAS: AtualizacaoData["area"][] = ["emergencias", "ti", "anestesiologia"];

export default function AtualizacoesGrid({ atualizacoes, initialArea }: Props) {
  const validAreas: FilterArea[] = ["todas", "emergencias", "ti", "anestesiologia"];
  const init: FilterArea = validAreas.includes(initialArea as FilterArea)
    ? (initialArea as FilterArea)
    : "todas";
  const [active, setActive] = useState<FilterArea>(init);

  const grouped = atualizacoes.reduce<Record<AtualizacaoData["area"], AtualizacaoData[]>>(
    (acc, item) => {
      if (acc[item.area]) acc[item.area].push(item);
      return acc;
    },
    { emergencias: [], ti: [], anestesiologia: [] }
  );

  const areasToShow: AtualizacaoData["area"][] = ALL_AREAS.filter((area) => {
    if (grouped[area].length === 0) return false;
    if (active === "todas") return true;
    return area === active;
  });

  function handleTabClick(value: FilterArea) {
    // Clicking the active non-"todas" tab deselects → volta para "todas"
    if (value !== "todas" && value === active) {
      setActive("todas");
    } else {
      setActive(value);
    }
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabClick(tab.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              active === tab.value
                ? "border-accent bg-accent/15 text-accent"
                : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            {tab.label}
            {active === tab.value && tab.value !== "todas" && (
              <span className="ml-1.5 opacity-60">×</span>
            )}
          </button>
        ))}
      </div>

      {areasToShow.length === 0 && (
        <p className="text-sm text-white/40 text-center">
          Nenhuma atualização nesta área ainda.
        </p>
      )}

      {/* Cards — use key={area+active} so defaultOpen resets on tab change */}
      <div className="flex flex-col gap-4">
        {areasToShow.map((area) => (
          <BoletimCard
            key={`${area}-${active}`}
            area={area}
            items={grouped[area]}
            defaultOpen={active !== "todas"}
          />
        ))}
      </div>
    </div>
  );
}
