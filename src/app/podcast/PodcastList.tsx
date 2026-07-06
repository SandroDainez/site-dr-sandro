"use client";

import { useState } from "react";
import { Mic, ExternalLink } from "lucide-react";
import type { PodcastData } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";
import { colStyle } from "@/lib/card-grid";

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}

function embedFor(url: string): { type: "spotify" | "apple"; src: string } | null {
  if (!url) return null;
  if (/open\.spotify\.com/.test(url)) {
    return { type: "spotify", src: url.replace("open.spotify.com/", "open.spotify.com/embed/").split("?")[0] };
  }
  if (/podcasts\.apple\.com/.test(url)) {
    return { type: "apple", src: url.replace("podcasts.apple.com", "embed.podcasts.apple.com") };
  }
  return null;
}

function formatDate(iso: string): string {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function Card({ ep }: { ep: PodcastData }) {
  const [playing, setPlaying] = useState(false);
  const yt = youtubeId(ep.embedUrl);
  const embed = embedFor(ep.embedUrl);
  const thumb = ep.imageUrl || (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : "");

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
      {/* Mídia 16:9 (capa / thumb do YouTube; clica p/ tocar o YouTube) */}
      <div className="relative aspect-video w-full bg-black">
        {yt && playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&playsinline=1`}
            title={ep.titulo}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : yt ? (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async" src={thumb} alt={ep.titulo} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/45">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/40 transition group-hover:scale-110">
                <span className="text-xl text-white">▶</span>
              </div>
            </div>
            {ep.duracao && (
              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white/90">{ep.duracao}</span>
            )}
          </button>
        ) : thumb ? (
          // áudio/Spotify com capa própria
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async" src={thumb} alt={ep.titulo} className="h-full w-full object-cover" />
            <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-black/55 text-accent backdrop-blur-sm">
              <Mic className="h-4 w-4" />
            </div>
            {ep.duracao && (
              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white/90">{ep.duracao}</span>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 to-transparent text-accent/60">
            <Mic className="h-9 w-9" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
          <span>{formatDate(ep.data)}</span>
          {ep.duracao && <span>· ⏱ {ep.duracao}</span>}
        </div>
        <h2 className="text-[15px] font-semibold leading-snug text-white">{ep.titulo}</h2>
        {ep.descricao && (
          <div
            className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/55 [&_a]:text-accent"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(ep.descricao) }}
          />
        )}

        {/* Player de áudio enviado */}
        {ep.audioUrl && <audio controls preload="none" src={ep.audioUrl} className="mt-3 w-full" />}

        {/* Embed Spotify / Apple (compacto) */}
        {embed && (
          <div className="mt-3 overflow-hidden rounded-xl">
            <iframe
              src={embed.src}
              title={ep.titulo}
              className="w-full"
              style={{ height: embed.type === "spotify" ? 152 : 175 }}
              allow="encrypted-media; clipboard-write; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        )}

        {/* Link externo sem embed conhecido (e não é YouTube) */}
        {ep.embedUrl && !embed && !yt && (
          <a
            href={ep.embedUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-accent/15 border border-accent/40 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/25"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Ouvir
          </a>
        )}
      </div>
    </article>
  );
}

export default function PodcastList({ podcasts, cols }: { podcasts: PodcastData[]; cols?: number }) {
  const sorted = [...podcasts].filter((p) => p.titulo).sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
        <Mic className="mx-auto mb-3 h-7 w-7 text-white/30" />
        <p className="text-sm text-white/50">Episódios em breve.</p>
      </div>
    );
  }

  return (
    <div className="card-grid gap-5" style={colStyle(cols ?? 3)}>
      {sorted.map((ep) => <Card key={ep.id} ep={ep} />)}
    </div>
  );
}
