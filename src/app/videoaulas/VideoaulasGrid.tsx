"use client";

import { useState } from "react";
import type { VideoaulaData } from "@/lib/content";

type Props = {
  videoaulas: VideoaulaData[];
};

type FilterArea = "todas" | VideoaulaData["area"];

const tabs: { value: FilterArea; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "geral", label: "Geral" },
  { value: "emergencias", label: "Emergências" },
  { value: "ti", label: "TI" },
  { value: "anestesiologia", label: "Anestesiologia" },
];

const areaConfig: Record<VideoaulaData["area"], { label: string; badge: string; color: string }> = {
  geral: {
    label: "Geral",
    badge: "bg-teal-400/15 text-teal-400 border-teal-400/30",
    color: "text-teal-400",
  },
  emergencias: {
    label: "Emergências",
    badge: "bg-red-400/15 text-red-400 border-red-400/30",
    color: "text-red-400",
  },
  ti: {
    label: "TI",
    badge: "bg-blue-400/15 text-blue-400 border-blue-400/30",
    color: "text-blue-400",
  },
  anestesiologia: {
    label: "Anestesiologia",
    badge: "bg-violet-400/15 text-violet-400 border-violet-400/30",
    color: "text-violet-400",
  },
};

const nivelLabel: Record<string, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? match[1] : null;
}

function VideoCard({ item }: { item: VideoaulaData }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = areaConfig[item.area];
  const ytId = item.videoUrl ? getYoutubeId(item.videoUrl) : null;
  const isProxyVideo = item.videoUrl.startsWith("/api/img");
  const isLong = item.descricao.length > 140;
  const display = expanded || !isLong ? item.descricao : item.descricao.slice(0, 120) + "…";

  // Determine thumbnail
  let thumbSrc: string | null = null;
  if (item.imageUrl) {
    thumbSrc = item.imageUrl;
  } else if (ytId) {
    thumbSrc = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  // Determine video button
  let videoButton: React.ReactNode = null;
  if (item.videoUrl) {
    if (ytId) {
      videoButton = (
        <a
          href={item.videoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/[0.1]"
        >
          ▶ Assistir no YouTube
        </a>
      );
    } else if (isProxyVideo) {
      videoButton = (
        <a
          href={item.videoUrl}
          target="_blank"
          rel="noreferrer"
          download
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/[0.1]"
        >
          ⬇ Baixar / Assistir
        </a>
      );
    } else {
      videoButton = (
        <a
          href={item.videoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/[0.1]"
        >
          ▶ Assistir
        </a>
      );
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition hover:-translate-y-0.5 hover:border-white/20">
      {thumbSrc && (
        <img
          src={thumbSrc}
          alt={item.titulo}
          className="w-full max-h-44 object-cover"
        />
      )}
      <div className="flex flex-col flex-1 p-5">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${cfg.badge}`}>
            {cfg.label}
          </span>
          {item.gratuita ? (
            <span className="rounded-full border border-green-400/30 bg-green-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-green-400">
              Gratuita
            </span>
          ) : (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-400">
              Assinantes
            </span>
          )}
          {item.nivel && (
            <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/60 uppercase tracking-[0.1em]">
              {nivelLabel[item.nivel] ?? item.nivel}
            </span>
          )}
          {item.duracao && (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-white/50">
              ⏱ {item.duracao}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-[15px] font-semibold text-white leading-snug">
          {item.titulo}
        </h2>

        {/* Description */}
        <div className="mt-2 text-sm leading-relaxed text-white/55 flex-1">
          {display}
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="ml-1 text-accent/60 hover:text-accent transition text-xs whitespace-nowrap"
            >
              {expanded ? "[menos]" : "[mais]"}
            </button>
          )}
        </div>

        {/* Video button */}
        {videoButton && (
          <div className="mt-4">
            {videoButton}
          </div>
        )}
      </div>
    </article>
  );
}

export default function VideoaulasGrid({ videoaulas }: Props) {
  const [active, setActive] = useState<FilterArea>("todas");

  const sorted = [...videoaulas].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const filtered = active === "todas" ? sorted : sorted.filter((v) => v.area === active);

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
        <p className="text-sm text-white/40 text-center py-12">
          Nenhuma videoaula nesta área ainda.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <VideoCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
