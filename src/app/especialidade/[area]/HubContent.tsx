"use client";

import { useState } from "react";
import { ChevronDown, Download, PlayCircle } from "lucide-react";
import { sanitizeRichText } from "@/lib/rich-text";

// Componentes do hub de especialidade: o conteúdo abre ALI MESMO (acordeão),
// em vez de ser um link que leva para outra página. Assim, ao navegar por área,
// o usuário lê de fato o que existe sem sair do lugar.

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export type Article = {
  id: string;
  titulo: string;
  conteudo?: string;
  resumo?: string;
  imageUrl?: string;
  imageCaption?: string;
  imageSize?: number;
  data?: string;
  download?: { url: string; label: string };
};

const proseCls =
  "text-sm leading-relaxed text-white/75 [&_a]:text-accent [&_a]:underline [&_h2]:mt-4 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-semibold [&_h3]:text-white [&_p]:mb-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:text-white [&_img]:my-3 [&_img]:rounded-xl";

export function HubArticles({ items, accent }: { items: Article[]; accent: string }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-2">
      {items.map((x) => {
        const isOpen = open.has(x.id);
        const html = sanitizeRichText(x.conteudo);
        return (
          <div
            key={x.id}
            className={`overflow-hidden rounded-xl border bg-white/[0.03] transition ${isOpen ? "border-white/20" : "border-white/10 hover:border-white/20"}`}
          >
            <button
              type="button"
              onClick={() => toggle(x.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-white">{x.titulo}</span>
                {fmtDate(x.data) && <span className="mt-0.5 block text-[11px] text-white/40">{fmtDate(x.data)}</span>}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 ${accent} transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="border-t border-white/10 px-4 pb-5 pt-4">
                {x.imageUrl && (
                  <figure className="mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading="lazy"
                      decoding="async"
                      src={x.imageUrl}
                      alt={x.imageCaption || x.titulo}
                      className="rounded-xl border border-white/10 object-contain"
                      style={x.imageSize ? { maxWidth: x.imageSize } : undefined}
                    />
                    {x.imageCaption && <figcaption className="mt-1 text-xs text-white/40">{x.imageCaption}</figcaption>}
                  </figure>
                )}
                {x.resumo && (
                  <div
                    className="mb-3 text-sm font-medium leading-relaxed text-white/80 [&_a]:text-accent [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(x.resumo) }}
                  />
                )}
                {html && <div className={proseCls} dangerouslySetInnerHTML={{ __html: html }} />}
                {!html && !x.resumo && !x.download && <p className="text-sm text-white/40">Conteúdo em preparação.</p>}

                {x.download && (
                  <a
                    href={x.download.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
                  >
                    <Download className="h-4 w-4" /> {x.download.label || "Baixar material"}
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export type Video = {
  id: string;
  titulo: string;
  descricao?: string;
  videoUrl: string;
  duracao?: string;
};

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}

export function HubVideos({ items, accent }: { items: Video[]; accent: string }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((v) => {
        const isOpen = open === v.id;
        const ytId = v.videoUrl ? youtubeId(v.videoUrl) : null;
        return (
          <div
            key={v.id}
            className={`overflow-hidden rounded-2xl border bg-white/[0.03] transition ${isOpen ? "border-white/20 sm:col-span-2" : "border-white/10 hover:border-white/20"}`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : v.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="flex min-w-0 items-center gap-2">
                <PlayCircle className={`h-5 w-5 shrink-0 ${accent}`} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">{v.titulo}</span>
                  {v.duracao && <span className="text-[11px] text-white/40">{v.duracao}</span>}
                </span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 ${accent} transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="border-t border-white/10 p-4">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                  {ytId ? (
                    <iframe
                      className="aspect-video w-full"
                      src={`https://www.youtube.com/embed/${ytId}`}
                      title={v.titulo}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : v.videoUrl ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={v.videoUrl} controls playsInline className="aspect-video w-full" />
                  ) : (
                    <p className="p-6 text-center text-sm text-white/40">Vídeo indisponível.</p>
                  )}
                </div>
                {v.descricao && <p className="mt-3 text-sm leading-relaxed text-white/70">{v.descricao}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
