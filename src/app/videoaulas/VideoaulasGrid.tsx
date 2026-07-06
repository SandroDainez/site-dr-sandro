"use client";

import { useState, useEffect, type CSSProperties } from "react";
import type { VideoaulaData } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";
import AulaQuizModal from "./AulaQuizModal";
import { colStyle } from "@/lib/card-grid";

type Props = {
  videoaulas: VideoaulaData[];
  cols?: number;
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
    badge: "bg-emerg/15 text-emerg border-emerg/30",
    color: "text-emerg",
  },
  ti: {
    label: "TI",
    badge: "bg-inten/15 text-inten border-inten/30",
    color: "text-inten",
  },
  anestesiologia: {
    label: "Anestesiologia",
    badge: "bg-anest/15 text-anest border-anest/30",
    color: "text-anest",
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

function VideoModal({ item, onClose }: { item: VideoaulaData; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const ytModal = item.videoUrl ? getYoutubeId(item.videoUrl) : null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white transition text-sm flex items-center gap-1"
        >
          ✕ Fechar (Esc)
        </button>
        {ytModal ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytModal}?autoplay=1&rel=0&playsinline=1`}
            title={item.titulo}
            className="aspect-video w-full rounded-2xl bg-black shadow-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            src={item.videoUrl}
            controls
            autoPlay
            playsInline
            className="w-full rounded-2xl bg-black shadow-2xl"
            style={{ maxHeight: "80vh" }}
          />
        )}
        <p className="mt-3 text-center text-sm font-medium text-white/70">{item.titulo}</p>
      </div>
    </div>
  );
}

export function VideoCard({ item }: { item: VideoaulaData }) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [inlinePlaying, setInlinePlaying] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const cfg = areaConfig[item.area];
  const ytId = item.videoUrl ? getYoutubeId(item.videoUrl) : null;
  const isProxyVideo = item.videoUrl.startsWith("/api/img");
  const hasVideo = !!item.videoUrl;
  const hasQuiz = (item.quiz?.length ?? 0) > 0;
  const isLong = item.descricao.replace(/<[^>]*>/g, "").length > 140;
  const objPos: CSSProperties = item.mostrarInteiro
    ? { objectFit: "contain" }
    : {
        objectPosition: `${item.enquadramento ?? 50}% ${item.enquadramentoY ?? 50}%`,
        transform: `scale(${(item.zoom ?? 100) / 100})`,
        transformOrigin: `${item.enquadramento ?? 50}% ${item.enquadramentoY ?? 50}%`,
      };

  // Thumbnail
  let thumbSrc: string | null = null;
  if (item.imageUrl) thumbSrc = item.imageUrl;
  else if (ytId) thumbSrc = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

  return (
    <>
      {playerOpen && (isProxyVideo || ytId) && (
        <VideoModal item={item} onClose={() => setPlayerOpen(false)} />
      )}
      {quizOpen && <AulaQuizModal item={item} onClose={() => setQuizOpen(false)} />}
    <article className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition hover:border-white/20">
      {thumbSrc ? (
        ytId && inlinePlaying && !hasQuiz ? (
          <div className="relative overflow-hidden bg-black" style={{ height: item.imageSize ?? 176 }}>
            {/* Toca o YouTube DENTRO do card (sem sair do site) */}
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`}
              title={item.titulo}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <button
              type="button"
              onClick={() => setPlayerOpen(true)}
              className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm transition hover:bg-black/90"
            >
              ⛶ Expandir
            </button>
          </div>
        ) : (
        <div
          className={`relative overflow-hidden ${hasVideo ? "cursor-pointer group" : ""}`}
          style={{ height: item.imageSize ?? 176 }}
          onClick={() => { if (!hasVideo) return; if (hasQuiz) setQuizOpen(true); else if (ytId) setInlinePlaying(true); else setPlayerOpen(true); }}
        >
          <img loading="lazy" decoding="async" src={thumbSrc} alt={item.titulo} style={objPos} className="absolute inset-0 h-full w-full object-cover" />
          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                <span className="text-white text-lg">▶</span>
              </div>
            </div>
          )}
          {item.duracao && ytId && (
            <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
              {item.duracao}
            </span>
          )}
        </div>
        )
      ) : isProxyVideo ? (
        inlinePlaying ? (
          <div className="relative overflow-hidden bg-black" style={{ height: item.imageSize ?? 176 }}>
            {/* Vídeo tocando dentro do card (playsInline impede abrir em tela cheia nativa no iPhone) */}
            <video
              src={item.videoUrl}
              controls
              autoPlay
              playsInline
              style={objPos}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Botão expandir p/ tela cheia */}
            <button
              type="button"
              onClick={() => setPlayerOpen(true)}
              className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm transition hover:bg-black/90"
            >
              ⛶ Expandir
            </button>
          </div>
        ) : (
          <div
            className="relative cursor-pointer group overflow-hidden bg-black"
            style={{ height: item.imageSize ?? 176 }}
            onClick={() => hasQuiz ? setQuizOpen(true) : setInlinePlaying(true)}
          >
            {/* Preview = primeiro frame do vídeo (imagem cheia do card). pointer-events-none
                manda o toque ao container (abre quiz/toca inline). O #418 NÃO vinha daqui
                (era o dpl do logo, já corrigido), então é seguro mostrar o frame. */}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={`${item.videoUrl}#t=0.5`}
              muted
              playsInline
              preload="metadata"
              style={objPos}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition group-hover:bg-black/45">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/40 transition group-hover:scale-110">
                <span className="text-white text-xl">▶</span>
              </div>
            </div>
            {item.duracao && (
              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
                {item.duracao}
              </span>
            )}
          </div>
        )
      ) : null}

      <div className="flex flex-col flex-1 p-5">
        {/* Badges */}
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
        <h2 className="text-[15px] font-semibold text-white leading-snug">{item.titulo}</h2>

        {/* Description */}
        <div className="mt-2 text-sm leading-relaxed text-white/55 flex-1">
          <span
            className={!descExpanded && isLong ? "line-clamp-3" : ""}
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.descricao) }}
          />
          {isLong && (
            <button
              type="button"
              onClick={() => setDescExpanded(!descExpanded)}
              className="ml-1 text-accent/60 hover:text-accent transition text-xs whitespace-nowrap"
            >
              {descExpanded ? "[menos]" : "[mais]"}
            </button>
          )}
        </div>

        {/* Material em PDF (se houver) */}
        {item.pdfUrl && (
          <div className="mt-3">
            <a
              href={item.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/75 transition hover:border-accent/40 hover:text-white"
            >
              📄 {item.pdfLabel?.trim() || "Material da aula (PDF)"}
            </a>
          </div>
        )}

        {/* Action buttons */}
        {hasVideo && hasQuiz && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setQuizOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/30 px-4 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25"
            >
              ▶ Assistir + teste de conhecimento
            </button>
          </div>
        )}
        {hasVideo && !hasQuiz && (
          <div className="mt-4 flex flex-wrap gap-2">
            {ytId ? (
              <>
                <button
                  type="button"
                  onClick={() => setInlinePlaying(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/30 px-4 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25"
                >
                  ▶ Assistir aqui
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.1] hover:text-white"
                >
                  ⛶ Tela cheia
                </button>
                <a
                  href={item.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-white/45 transition hover:text-white/70"
                >
                  YouTube ↗
                </a>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setInlinePlaying(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/30 px-4 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25"
                >
                  ▶ Assistir aqui
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.1] hover:text-white"
                >
                  ⛶ Tela cheia
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </article>
    </>
  );
}

export default function VideoaulasGrid({ videoaulas, cols }: Props) {
  const [active, setActive] = useState<FilterArea>("todas");

  const sorted = [...videoaulas].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const filtered = active === "todas" ? sorted : sorted.filter((v) => v.area === active || v.areas?.includes(active as "emergencias" | "ti" | "anestesiologia"));

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

      <div className="card-grid gap-5" style={colStyle(cols ?? 3)}>
        {filtered.map((item) => (
          <VideoCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
