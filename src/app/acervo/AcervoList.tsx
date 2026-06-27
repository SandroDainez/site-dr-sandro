"use client";

import { useState } from "react";
import { FileText, BookOpen, ImageIcon, Video, File, Download, Library } from "lucide-react";
import type { AcervoItemData, AcervoArquivo } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";

function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}
function formatDate(iso: string): string {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}
const arqIcon = { pdf: FileText, livro: BookOpen, imagem: ImageIcon, video: Video, arquivo: File };

function ArqButton({ arq }: { arq: AcervoArquivo }) {
  if (!arq.url) return null;
  const Icon = arqIcon[arq.tipo] || File;
  const label = arq.titulo || ({ pdf: "PDF", livro: "Livro", imagem: "Imagem", video: "Vídeo", arquivo: "Arquivo" }[arq.tipo]);
  return (
    <a
      href={arq.url}
      target="_blank"
      rel="noreferrer"
      download={arq.tipo !== "video"}
      className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20"
    >
      <Icon className="h-3.5 w-3.5" /> {label} <Download className="h-3 w-3 opacity-70" />
    </a>
  );
}

function Card({ item }: { item: AcervoItemData }) {
  const [playing, setPlaying] = useState(false);
  const yt = item.videoUrl ? ytId(item.videoUrl) : null;
  const thumb = item.capaUrl || (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : "");
  const hasVideo = !!item.videoUrl;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
      {(thumb || hasVideo) && (
        <div className="relative aspect-video w-full bg-black">
          {hasVideo && playing ? (
            yt ? (
              <iframe src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&playsinline=1`} title={item.titulo} className="absolute inset-0 h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            ) : (
              <video src={item.videoUrl} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black object-contain" />
            )
          ) : (
            <button type="button" onClick={() => hasVideo && setPlaying(true)} className={`group absolute inset-0 h-full w-full ${hasVideo ? "cursor-pointer" : "cursor-default"}`}>
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" decoding="async" src={thumb} alt={item.titulo} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-white/20"><Library className="h-10 w-10" /></div>
              )}
              {hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/45">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/40 transition group-hover:scale-110"><span className="text-xl text-white">▶</span></div>
                </div>
              )}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {item.categoria && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent">{item.categoria}</span>
          )}
          <span className="text-[11px] text-white/35">{formatDate(item.data)}</span>
        </div>
        <h2 className="text-base font-semibold leading-snug text-white">{item.titulo}</h2>
        {item.descricao && (
          <div className="mt-2 text-sm leading-relaxed text-white/60 [&_a]:text-accent" dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.descricao) }} />
        )}
        {item.arquivos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.arquivos.map((arq) => <ArqButton key={arq.id} arq={arq} />)}
          </div>
        )}
      </div>
    </article>
  );
}

export default function AcervoList({ itens }: { itens: AcervoItemData[] }) {
  const sorted = [...itens].filter((x) => x.titulo).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
        <Library className="mx-auto mb-3 h-7 w-7 text-white/30" />
        <p className="text-sm text-white/50">Conteúdos em breve.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((item) => <Card key={item.id} item={item} />)}
    </div>
  );
}
