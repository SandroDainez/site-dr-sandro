"use client";

import { useState, useEffect } from "react";
import { FileText, BookOpen, ImageIcon, Video, File, Download, Library } from "lucide-react";
import type { AcervoItemData, AcervoArquivo } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";
import { colStyle } from "@/lib/card-grid";
import { dataCurta } from "@/lib/format-date";

function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}
const formatDate = dataCurta;
const arqIcon = { pdf: FileText, livro: BookOpen, imagem: ImageIcon, video: Video, arquivo: File };

// Arquivos NÃO-PDF: botão simples de baixar/abrir.
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

// PDF: mesma experiência do protocolo — Ler (na página), Tela cheia e Baixar.
function PdfButtons({ arq, aberto, onLer, onFull }: { arq: AcervoArquivo; aberto: boolean; onLer: () => void; onFull: () => void }) {
  const nome = arq.titulo || "PDF";
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onLer} className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-4 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25">
        {aberto ? "Fechar leitura ↑" : `📄 Ler ${nome}`}
      </button>
      <button type="button" onClick={onFull} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/70 transition hover:border-accent/40 hover:text-white">
        ⛶ Tela cheia
      </button>
      <a href={arq.url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/70 transition hover:border-accent/40 hover:text-white">
        Baixar PDF ↓
      </a>
    </div>
  );
}

function Card({ item }: { item: AcervoItemData }) {
  const [playing, setPlaying] = useState(false);
  const [pdfInline, setPdfInline] = useState<string | null>(null); // url do PDF aberto na página
  const [full, setFull] = useState<string | null>(null);            // url do PDF em tela cheia
  const yt = item.videoUrl ? ytId(item.videoUrl) : null;
  const thumb = item.capaUrl || (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : "");
  const hasVideo = !!item.videoUrl;
  const arquivos = item.arquivos.filter((a) => a.url);

  // fecha a tela cheia com Esc + trava o scroll do fundo
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [full]);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
      {(thumb || hasVideo) && (
        <div className={`relative w-full bg-black ${hasVideo ? "aspect-video" : ""}`} style={hasVideo ? undefined : { height: item.capaAltura ?? 200 }}>
          {hasVideo && playing ? (
            yt ? (
              <iframe src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&playsinline=1`} title={item.titulo} className="absolute inset-0 h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={item.videoUrl} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black object-contain" />
            )
          ) : (
            <button type="button" onClick={() => hasVideo && setPlaying(true)} className={`group absolute inset-0 h-full w-full ${hasVideo ? "cursor-pointer" : "cursor-default"}`}>
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" decoding="async" src={thumb} alt={item.titulo} className={`h-full w-full ${hasVideo ? "object-cover" : "object-contain"}`} />
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
        {arquivos.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {arquivos.map((arq) =>
              arq.tipo === "pdf" ? (
                <PdfButtons
                  key={arq.id}
                  arq={arq}
                  aberto={pdfInline === arq.url}
                  onLer={() => setPdfInline((p) => (p === arq.url ? null : arq.url))}
                  onFull={() => setFull(arq.url)}
                />
              ) : (
                <div key={arq.id}><ArqButton arq={arq} /></div>
              )
            )}
          </div>
        )}
        {pdfInline && (
          <iframe src={pdfInline} title={item.titulo} allowFullScreen className="mt-3 w-full rounded-xl border border-white/10 bg-white" style={{ height: "70vh" }} />
        )}
      </div>

      {/* Tela cheia do PDF */}
      {full && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 p-3 backdrop-blur-sm sm:p-5">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <h3 className="min-w-0 truncate text-base font-semibold text-white">{item.titulo}</h3>
            <div className="flex shrink-0 items-center gap-2">
              <a href={full} target="_blank" rel="noreferrer" download className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/15">
                Baixar ↓
              </a>
              <button type="button" onClick={() => setFull(null)} className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25">
                ✕ Fechar (Esc)
              </button>
            </div>
          </div>
          <iframe src={`${full}#view=FitH`} title={item.titulo} className="min-h-0 w-full flex-1 rounded-xl bg-white" />
        </div>
      )}
    </article>
  );
}

export default function AcervoList({ itens, cols }: { itens: AcervoItemData[]; cols?: number }) {
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
    <div className="card-grid gap-5" style={colStyle(cols ?? 3)}>
      {sorted.map((item) => <Card key={item.id} item={item} />)}
    </div>
  );
}
