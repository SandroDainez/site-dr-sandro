"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown, Video, FileText, Presentation, BookOpen, Download, Check,
} from "lucide-react";
import type { CursoAula, CursoMaterial } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}

const tipoIcon = { video: Video, slides: Presentation, pdf: FileText, ebook: BookOpen };

function MaterialBlock({ mat }: { mat: CursoMaterial }) {
  const [open, setOpen] = useState(false);
  if (!mat.url) return null;

  if (mat.tipo === "video") {
    const yt = youtubeId(mat.url);
    return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
        {yt ? (
          <iframe
            src={`https://www.youtube.com/embed/${yt}?rel=0&playsinline=1`}
            title={mat.titulo}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video src={mat.url} controls playsInline className="aspect-video w-full bg-black" />
        )}
        {mat.titulo && <p className="px-4 py-2 text-xs text-white/50">{mat.titulo}</p>}
      </div>
    );
  }

  // slides (imagem) → mostra direto
  const isImage = mat.tipo === "slides" && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(mat.url);
  if (isImage) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mat.url} alt={mat.titulo} className="w-full object-contain" />
        {mat.titulo && <p className="px-4 py-2 text-xs text-white/50">{mat.titulo}</p>}
      </div>
    );
  }

  // pdf / ebook / slides-pdf → ler embutido + baixar
  const Icon = tipoIcon[mat.tipo];
  const tipoNome = mat.tipo === "slides" ? "Slides" : mat.tipo === "ebook" ? "E-book" : "PDF";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="flex flex-wrap items-center gap-3 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-white/60">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-white/80">{mat.titulo || tipoNome}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-accent/40 hover:text-white"
        >
          {open ? "Fechar" : `Abrir ${tipoNome.toLowerCase()}`}
        </button>
        <a
          href={mat.url}
          target="_blank"
          rel="noreferrer"
          download
          className="flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/40 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25"
        >
          <Download className="h-3.5 w-3.5" /> Baixar
        </a>
      </div>
      {open && (
        <iframe src={`${mat.url}#view=FitH`} title={mat.titulo} className="h-[78vh] w-full rounded-b-xl border-t border-white/10 bg-white" />
      )}
    </div>
  );
}

function AulaItem({ aula, index }: { aula: CursoAula; index: number; }) {
  const [open, setOpen] = useState(index === 0);
  const [done, setDone] = useState(false);

  const storeKey = `curso-aula-${aula.id}`;
  useEffect(() => {
    try { setDone(localStorage.getItem(storeKey) === "1"); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleDone(e: React.MouseEvent) {
    e.stopPropagation();
    setDone((d) => {
      const nv = !d;
      try { localStorage.setItem(storeKey, nv ? "1" : "0"); } catch {}
      return nv;
    });
  }

  return (
    <div className={`rounded-2xl border bg-white/[0.03] transition ${open ? "border-white/20" : "border-white/10 hover:border-white/15"}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-4 text-left">
        <span
          onClick={toggleDone}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
            done ? "border-accent bg-accent text-[#07090f]" : "border-white/20 text-white/60 hover:border-accent/50"
          }`}
          title={done ? "Concluída" : "Marcar como concluída"}
        >
          {done ? <Check className="h-4 w-4" /> : index + 1}
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-white">{aula.titulo || `Aula ${index + 1}`}</span>
        <span className="hidden text-[11px] text-white/35 sm:inline">
          {aula.materiais.length} {aula.materiais.length === 1 ? "material" : "materiais"}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-white/10 p-4">
          {aula.descricao && (
            <div
              className="text-sm leading-relaxed text-white/70 [&_a]:text-accent"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(aula.descricao) }}
            />
          )}
          {aula.materiais.map((mat) => (
            <MaterialBlock key={mat.id} mat={mat} />
          ))}
          {aula.materiais.length === 0 && !aula.descricao && (
            <p className="text-sm text-white/40">Material em preparação.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CursoView({ aulas }: { aulas: CursoAula[] }) {
  return (
    <div className="space-y-3">
      <p className="mb-1 text-xs uppercase tracking-[0.12em] text-white/40">Aulas do curso</p>
      {aulas.map((aula, i) => (
        <AulaItem key={aula.id} aula={aula} index={i} />
      ))}
    </div>
  );
}
