"use client";

import { Mic, ExternalLink } from "lucide-react";
import type { PodcastData } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}

function embedFor(url: string): { type: "spotify" | "youtube" | "apple"; src: string } | null {
  if (!url) return null;
  if (/open\.spotify\.com/.test(url)) {
    return { type: "spotify", src: url.replace("open.spotify.com/", "open.spotify.com/embed/").split("?")[0] };
  }
  const yt = youtubeId(url);
  if (yt) return { type: "youtube", src: `https://www.youtube.com/embed/${yt}?rel=0&playsinline=1` };
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

export default function PodcastList({ podcasts }: { podcasts: PodcastData[] }) {
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
    <div className="space-y-5">
      {sorted.map((ep) => {
        const embed = embedFor(ep.embedUrl);
        return (
          <article key={ep.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start gap-4">
              {ep.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ep.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-accent">
                  <Mic className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                  <span>{formatDate(ep.data)}</span>
                  {ep.duracao && <span>· ⏱ {ep.duracao}</span>}
                </div>
                <h2 className="text-base font-semibold leading-snug text-white">{ep.titulo}</h2>
                {ep.descricao && (
                  <div
                    className="mt-2 text-sm leading-relaxed text-white/60 [&_a]:text-accent"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(ep.descricao) }}
                  />
                )}
              </div>
            </div>

            {/* Player de áudio enviado */}
            {ep.audioUrl && (
              <audio controls preload="none" src={ep.audioUrl} className="mt-4 w-full" />
            )}

            {/* Embed externo (Spotify / YouTube / Apple) */}
            {embed && (
              <div className="mt-4 overflow-hidden rounded-xl">
                {embed.type === "spotify" ? (
                  <iframe src={embed.src} title={ep.titulo} className="w-full" style={{ height: 152 }} allow="encrypted-media; clipboard-write; fullscreen; picture-in-picture" loading="lazy" />
                ) : embed.type === "apple" ? (
                  <iframe src={embed.src} title={ep.titulo} className="w-full" style={{ height: 175 }} allow="encrypted-media; clipboard-write" loading="lazy" />
                ) : (
                  <iframe src={embed.src} title={ep.titulo} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" />
                )}
              </div>
            )}

            {/* Link externo sem embed conhecido → botão */}
            {ep.embedUrl && !embed && (
              <a
                href={ep.embedUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/40 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/25"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Ouvir
              </a>
            )}
          </article>
        );
      })}
    </div>
  );
}
