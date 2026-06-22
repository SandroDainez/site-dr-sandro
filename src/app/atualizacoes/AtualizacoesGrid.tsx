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

const areaMeta: Record<
  AtualizacaoData["area"],
  { title: string; emoji: string }
> = {
  emergencias: { title: "ATUALIZAÇÕES EM EMERGÊNCIAS", emoji: "🚑" },
  ti: { title: "ATUALIZAÇÕES EM MEDICINA INTENSIVA", emoji: "🏥" },
  anestesiologia: { title: "ATUALIZAÇÕES EM ANESTESIOLOGIA", emoji: "🩺" },
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
}: {
  item: AtualizacaoData;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  // Split content at "Aplicação prática" or similar markers
  const parts = item.conteudo.split(/(Aplicação prática[^.]*\.)/i);
  const mainContent = parts[0] || item.conteudo;
  const pratica = parts[1];

  const isLong = item.conteudo.length > 300;
  const displayContent = expanded || !isLong ? mainContent : mainContent.slice(0, 200) + "…";

  return (
    <div>
      {/* 🔗 Link — same position as Discord (above the topic) */}
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-accent/80 hover:text-accent transition font-medium"
        >
          🔗 {item.titulo}
        </a>
      )}

      <Sep />

      {/* 📢 Topic title */}
      <div className="text-sm font-bold text-white leading-snug flex items-start gap-1.5">
        <span>📢</span>
        <span>
          <span className="text-accent/60">{index + 1}.</span>{" "}
          {item.titulo}
        </span>
      </div>

      {/* 📝 Content */}
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

      {/* 💡 Aplicação prática */}
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
}: {
  area: AtualizacaoData["area"];
  items: AtualizacaoData[];
}) {
  const meta = areaMeta[area];

  const sorted = [...items].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );
  const latestDate = sorted[0]?.data || "";

  // Build "Também" list — extra topics beyond the main 3
  const extras = sorted.slice(3);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 transition hover:-translate-y-0.5 hover:border-white/20">
      {/* ═══ HEADER ═══ */}
      <div className="text-center space-y-1.5">
        <div className="text-sm font-black tracking-[0.2em] text-white">
          {meta.emoji} {meta.title}
        </div>
        <div className="text-xs text-white/40 flex items-center justify-center gap-1.5">
          <span>📆</span> {formatDateBR(latestDate)}
        </div>
      </div>

      {/* ═══ TOPICS ═══ */}
      <div className="mt-2">
        {sorted.slice(0, 3).map((item, idx) => (
          <div key={item.id} className={idx > 0 ? "mt-2" : ""}>
            <TopicBlock item={item} index={idx} />
            {idx < Math.min(sorted.length, 3) - 1 && <Sep />}
          </div>
        ))}
      </div>

      {/* ═══ TAMBÉM ═══ */}
      {extras.length > 0 && (
        <>
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
              <span>📕</span> Também:
            </div>
            <div className="mt-1.5 text-xs text-white/50 leading-relaxed">
              {extras.map((e, i) => (
                <span key={e.id}>
                  {e.link ? (
                    <a
                      href={e.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent/70 hover:text-accent transition"
                    >
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
        </>
      )}

      {/* ═══ FOOTER ═══ */}
      <div className="mt-5 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-center gap-1.5 text-xs text-white/25">
          <span>🤖</span>
          <span>Boletim gerado pelo Amigo 🦊 — {formatDateBR(latestDate)}</span>
        </div>
      </div>
    </div>
  );
}

export default function AtualizacoesGrid({ atualizacoes }: Props) {
  const [active, setActive] = useState<FilterArea>("todas");

  const areas: AtualizacaoData["area"][] = [
    "emergencias",
    "ti",
    "anestesiologia",
  ];

  // Group by area
  const grouped: Record<AtualizacaoData["area"], AtualizacaoData[]> = {
    emergencias: [],
    ti: [],
    anestesiologia: [],
  };

  for (const item of atualizacoes) {
    if (grouped[item.area]) {
      grouped[item.area].push(item);
    }
  }

  const visibleAreas = areas.filter((a) => grouped[a].length > 0);

  const filteredAreas =
    active === "todas"
      ? visibleAreas
      : visibleAreas.filter((a) => a === active);

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

      {filteredAreas.length === 0 && (
        <p className="text-sm text-white/40 text-center">
          Nenhuma atualização nesta área ainda.
        </p>
      )}

      {/* Boletins — 1 card por área, formato idêntico ao Discord */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAreas.map((area) => (
          <BoletimCard key={area} area={area} items={grouped[area]} />
        ))}
      </div>
    </div>
  );
}
