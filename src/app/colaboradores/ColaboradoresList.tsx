"use client";

import { useState } from "react";
import { PlayCircle, Stethoscope } from "lucide-react";
import type { ColaboradorData } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";
import { colStyle } from "@/lib/card-grid";
import { dataCurta } from "@/lib/format-date";

function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}
const formatDate = dataCurta;

function Card({ item }: { item: ColaboradorData }) {
  const [playing, setPlaying] = useState(false);
  const yt = item.videoUrl ? ytId(item.videoUrl) : null;
  const isProxy = item.videoUrl.startsWith("/api/img");
  const thumb = item.imageUrl || (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : "");

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
      {/* Mídia 16:9 */}
      <div className="relative aspect-video w-full bg-black">
        {!item.videoUrl ? (
          <div className="flex h-full w-full items-center justify-center text-white/20"><PlayCircle className="h-10 w-10" /></div>
        ) : playing ? (
          yt ? (
            <iframe
              src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&playsinline=1`}
              title={item.titulo}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video src={item.videoUrl} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black object-contain" />
          )
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full cursor-pointer">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={thumb} alt={item.titulo} className="h-full w-full object-cover" />
            ) : isProxy ? (
              <video src={`${item.videoUrl}#t=0.5`} muted playsInline preload="metadata" className="pointer-events-none h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/[0.03]"><PlayCircle className="h-10 w-10 text-white/25" /></div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/45">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/40 transition group-hover:scale-110">
                <span className="text-xl text-white">▶</span>
              </div>
            </div>
            {item.duracao && (
              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white/90">{item.duracao}</span>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Crédito ao médico */}
        {(item.medico || item.especialidade) && (
          <div className="mb-2 inline-flex items-center gap-1.5 self-start rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
            <Stethoscope className="h-3 w-3" />
            {item.medico}{item.medico && item.especialidade ? " · " : ""}<span className="font-normal text-accent/80">{item.especialidade}</span>
          </div>
        )}
        <h2 className="text-[15px] font-semibold leading-snug text-white">{item.titulo}</h2>
        <div className="mt-1 text-[11px] text-white/35">{formatDate(item.data)}</div>
        {item.descricao && (
          <div className="mt-2 text-sm leading-relaxed text-white/55 [&_a]:text-accent" dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.descricao) }} />
        )}

        {(item.bio || (item.links && item.links.length > 0)) && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">Sobre o profissional</p>
            {item.bio && <p className="text-xs leading-relaxed text-white/55">{item.bio}</p>}
            {item.links && item.links.filter((l) => l.url).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.links.filter((l) => l.url).map((l) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent transition hover:bg-accent/20">
                    {l.label || "Link"} ↗
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function ColaboradoresList({ items, cols }: { items: ColaboradorData[]; cols?: number }) {
  const sorted = [...items].filter((x) => x.titulo).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
        <p className="text-sm text-white/50">Em breve, materiais de profissionais parceiros.</p>
      </div>
    );
  }

  return (
    <div className="card-grid gap-5" style={colStyle(cols ?? 3)}>
      {sorted.map((item) => <Card key={item.id} item={item} />)}
    </div>
  );
}
