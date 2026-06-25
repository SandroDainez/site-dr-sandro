"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { PlayCircle } from "lucide-react";
import type { VideoaulaData } from "@/lib/content";

const areaConfig: Record<string, { badge: string; label: string }> = {
  geral: { badge: "bg-teal-400/15 text-teal-400 border-teal-400/30", label: "Geral" },
  emergencias: { badge: "bg-red-400/15 text-red-400 border-red-400/30", label: "Emergências" },
  ti: { badge: "bg-blue-400/15 text-blue-400 border-blue-400/30", label: "TI" },
  anestesiologia: { badge: "bg-violet-400/15 text-violet-400 border-violet-400/30", label: "Anestesiologia" },
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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 flex items-center gap-1 text-sm text-white/60 transition hover:text-white"
        >
          ✕ Fechar (Esc)
        </button>
        <video
          src={item.videoUrl}
          controls
          autoPlay
          playsInline
          className="w-full rounded-2xl bg-black shadow-2xl"
          style={{ maxHeight: "80vh" }}
        />
        <p className="mt-3 text-center text-sm font-medium text-white/70">{item.titulo}</p>
      </div>
    </div>
  );
}

export default function HomeVideoCard({ item }: { item: VideoaulaData }) {
  const [playerOpen, setPlayerOpen] = useState(false);
  const [inlinePlaying, setInlinePlaying] = useState(false);

  const cfg = areaConfig[item.area] ?? { badge: "text-white/60 border-white/20", label: item.area };
  const ytId = item.videoUrl ? getYoutubeId(item.videoUrl) : null;
  const isProxy = item.videoUrl.startsWith("/api/img");
  const hasVideo = !!item.videoUrl;
  // posição horizontal do conteúdo no recorte 4:5 (vídeos com personagem fora do centro)
  // mostrarInteiro = mostra o vídeo todo (contain); senão recorta (cover) com X/zoom/Y
  const objPos: CSSProperties = item.mostrarInteiro
    ? { objectFit: "contain" }
    : {
        objectPosition: `${item.enquadramento ?? 50}% 50%`,
        transform: `scale(${(item.zoom ?? 100) / 100})`,
        transformOrigin: `50% ${item.enquadramentoY ?? 50}%`,
      };

  // Thumbnail estático (imagem própria ou capa do YouTube)
  let thumbSrc: string | null = null;
  if (item.imageUrl) thumbSrc = item.imageUrl;
  else if (ytId) thumbSrc = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

  // Prévia clicável (thumb ou primeiro frame do vídeo enviado)
  const thumb = (
    <div className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-black group/thumb" onClick={() => setInlinePlaying(true)}>
      {thumbSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbSrc} alt={item.titulo} style={objPos} className="absolute inset-0 h-full w-full object-cover" />
      ) : isProxy ? (
        // pointer-events-none manda o clique ao container (toca inline) em vez do player nativo
        <video
          src={`${item.videoUrl}#t=0.5`}
          muted
          playsInline
          preload="metadata"
          style={objPos}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
          <PlayCircle className="h-10 w-10 text-white/25" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover/thumb:bg-black/45">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/40 transition group-hover/thumb:scale-110">
          <span className="text-xl text-white">▶</span>
        </div>
      </div>
      {item.duracao && (
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
          {item.duracao}
        </span>
      )}
    </div>
  );

  return (
    <>
      {/* Tela cheia é opcional (só p/ vídeo enviado), nunca automática */}
      {playerOpen && isProxy && <VideoModal item={item} onClose={() => setPlayerOpen(false)} />}

      <article className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition hover:-translate-y-0.5 hover:border-white/20">
        {/* Mídia — sempre toca embutida no card */}
        {!hasVideo ? (
          <div className="flex aspect-[4/5] w-full items-center justify-center bg-white/[0.03]">
            <PlayCircle className="h-10 w-10 text-white/20" />
          </div>
        ) : !inlinePlaying ? (
          thumb
        ) : ytId ? (
          // YouTube embutido (iframe) — toca no card, sem sair do site
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`}
              title={item.titulo}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          // Vídeo enviado — toca no card (cortado em 4:5 p/ esconder as tarjas brancas do vídeo)
          <div className="relative aspect-[4/5] overflow-hidden bg-black">
            <video src={item.videoUrl} controls autoPlay playsInline style={objPos} className="absolute inset-0 h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setPlayerOpen(true)}
              className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm transition hover:bg-black/90"
            >
              ⛶ Tela cheia
            </button>
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
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
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-white/50">
                {nivelLabel[item.nivel] ?? item.nivel}
              </span>
            )}
            {item.duracao && <span className="text-[10px] text-white/35">⏱ {item.duracao}</span>}
          </div>

          <h3 className="flex-1 text-sm font-semibold leading-snug text-white">{item.titulo}</h3>

          {hasVideo && !inlinePlaying && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setInlinePlaying(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/[0.1] hover:text-white"
              >
                ▶ Assistir
              </button>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
