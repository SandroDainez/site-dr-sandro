"use client";

import { useState, useEffect } from "react";
import type { AtualizacaoData } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";
import { dataCurta } from "@/lib/format-date";

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
    badge: "bg-emerg/15 text-emerg border-emerg/30",
    border: "border-emerg/25",
    sectionTitle: "text-emerg",
  },
  ti: {
    label: "🏥 Terapia Intensiva",
    badge: "bg-inten/15 text-inten border-inten/30",
    border: "border-inten/25",
    sectionTitle: "text-inten",
  },
  anestesiologia: {
    label: "🩺 Anestesiologia",
    badge: "bg-anest/15 text-anest border-anest/30",
    border: "border-anest/25",
    sectionTitle: "text-anest",
  },
};

const ALL_AREAS: AtualizacaoData["area"][] = ["emergencias", "ti", "anestesiologia"];

const formatDate = dataCurta;

export function UpdateCard({ item }: { item: AtualizacaoData }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = areaConfig[item.area];

  // Abre automaticamente a atualização apontada pela URL (#id), vinda da home.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace("#", ""));
    if (id && id === item.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpanded(true);
      setTimeout(() => {
        document.getElementById(`atualizacao-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [item.id]);

  return (
    <article
      id={`atualizacao-${item.id}`}
      className={`scroll-mt-24 rounded-2xl border ${cfg.border} bg-white/[0.03] transition ${
        expanded ? "border-white/20" : "hover:border-white/15"
      }`}
    >
      {/* Header clicável: abre/recolhe o material */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-5 text-left"
      >
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async"
            src={item.imageUrl}
            alt={item.titulo}
            className="shrink-0 rounded-lg object-contain"
            style={{ width: item.imageSize ?? 56, height: item.imageSize ?? 56 }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-[11px] text-white/35">{formatDate(item.data)}</span>
          </div>
          <h2 className="text-[15px] font-semibold text-white leading-snug">
            {item.titulo}
          </h2>
          {!expanded && (
            <p className="mt-1 text-xs text-white/40">Toque para abrir o material</p>
          )}
        </div>
        {/* Indicador de abrir/recolher */}
        <span
          className={`mt-1 shrink-0 text-white/40 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {/* Material (só quando expandido) */}
      {expanded && (
        <div className="px-5 pb-5 -mt-1">
          <div
            className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-white/70 border-t border-white/10 pt-4"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.conteudo) }}
          />
          {item.imageCaption && item.imageUrl && (
            <p className="mt-3 text-xs text-white/40 leading-relaxed">{item.imageCaption}</p>
          )}
          {item.link && (
            <div className="mt-3 text-xs">
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent/70 hover:text-accent transition font-medium"
              >
                🔗 Ver fonte →
              </a>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function SectionHeader({
  area,
}: {
  area: AtualizacaoData["area"];
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
    // multi-especialidade: aparece no grupo da área principal e de cada área extra
    const areas = new Set<AtualizacaoData["area"]>([item.area, ...(item.areas ?? [])]);
    for (const ar of areas) grouped[ar]?.push(item);
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
              <SectionHeader area={area} />
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
