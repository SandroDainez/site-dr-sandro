"use client";

import { useState, useEffect } from "react";
import { PlayCircle, Stethoscope, Maximize2, Layers } from "lucide-react";
import type { ColaboradorData } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";
import { colStyle } from "@/lib/card-grid";
import { dataCurta } from "@/lib/format-date";
import { bioCorTema } from "@/lib/bio-cor";
import { qrTarget, type QrTipo } from "@/lib/qr-link";
import qrcode from "qrcode-generator";

// QR determinístico (mesmo link → mesmo SVG, seguro p/ hidratação). Módulos pretos
// sobre transparente → renderizado dentro de uma caixa branca fica escaneável.
function qrDataUrl(text: string): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}
const formatDate = dataCurta;

// Modal de tela cheia (iframe do YouTube ou vídeo hospedado)
function VideoModal({ item, onClose }: { item: ColaboradorData; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  const yt = item.videoUrl ? ytId(item.videoUrl) : null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute -top-10 right-0 flex items-center gap-1 text-sm text-white/60 transition hover:text-white">✕ Fechar (Esc)</button>
        {yt ? (
          <iframe
            src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&playsinline=1`}
            title={item.titulo}
            className="aspect-video w-full rounded-2xl bg-black shadow-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={item.videoUrl} controls autoPlay playsInline className="w-full rounded-2xl bg-black shadow-2xl" style={{ maxHeight: "80vh" }} />
        )}
        <p className="mt-3 text-center text-sm font-medium text-white/70">{item.titulo}</p>
      </div>
    </div>
  );
}

// Área de mídia 16:9: capa → toca inline → botão Tela cheia (chama onExpand no pai).
function CardMedia({ item, onExpand }: { item: ColaboradorData; onExpand: () => void }) {
  const [playing, setPlaying] = useState(false);
  const yt = item.videoUrl ? ytId(item.videoUrl) : null;
  const isProxy = item.videoUrl.startsWith("/api/img");
  const thumb = item.imageUrl || (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : "");

  return (
    <div className="relative aspect-video w-full bg-black">
      {!item.videoUrl ? (
        <div className="flex h-full w-full items-center justify-center text-white/20"><PlayCircle className="h-10 w-10" /></div>
      ) : playing ? (
        <>
          {yt ? (
            <iframe
              src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&playsinline=1`}
              title={item.titulo}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video src={item.videoUrl} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black object-contain" />
          )}
          <button
            type="button"
            onClick={onExpand}
            className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm transition hover:bg-black/90"
          >
            <Maximize2 className="h-3 w-3" /> Tela cheia
          </button>
        </>
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
  );
}

function Credito({ medico, especialidade }: { medico?: string; especialidade?: string }) {
  if (!medico && !especialidade) return null;
  return (
    <div className="mb-2 inline-flex items-center gap-1.5 self-start rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
      <Stethoscope className="h-3 w-3" />
      {medico}{medico && especialidade ? " · " : ""}<span className="font-normal text-accent/80">{especialidade}</span>
    </div>
  );
}

// Caixa "Sobre o profissional" (bio + links + QR) — mostrada uma vez por card.
function BioBox({ item }: { item: ColaboradorData }) {
  const hasLinks = !!(item.links && item.links.filter((l) => l.url).length > 0);
  if (!item.bio && !item.qrLink && !hasLinks) return null;
  const tema = bioCorTema(item.bioCor);
  const alvo = qrTarget(item.qrLink, (item.qrTipo as QrTipo) || "whatsapp");
  return (
    <div className={`mt-3 flex gap-3 rounded-xl border p-3 ${tema.box}`}>
      <div className="min-w-0 flex-1">
        <p className={`mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tema.head}`}>Sobre o profissional</p>
        {item.bio && <p className="text-xs leading-relaxed text-white/55">{item.bio}</p>}
        {hasLinks && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.links!.filter((l) => l.url).map((l) => (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent transition hover:bg-accent/20">
                {l.label || "Link"} ↗
              </a>
            ))}
          </div>
        )}
      </div>
      {alvo && (
        <a href={alvo} target="_blank" rel="noreferrer" className="flex shrink-0 flex-col items-center gap-1 self-start rounded-lg bg-white p-1.5 transition hover:opacity-90" title="Escaneie ou toque para abrir o contato">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl(alvo)} alt="QR de contato" className="h-[72px] w-[72px]" />
          <span className="text-[8px] font-semibold uppercase tracking-wide text-black/55">Escaneie</span>
        </a>
      )}
    </div>
  );
}

// Card de uma aula única.
function Card({ item }: { item: ColaboradorData }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      {expanded && <VideoModal item={item} onClose={() => setExpanded(false)} />}
      <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
        <CardMedia item={item} onExpand={() => setExpanded(true)} />
        <div className="flex flex-1 flex-col p-5">
          <Credito medico={item.medico} especialidade={item.especialidade} />
          <h2 className="text-[15px] font-semibold leading-snug text-white">{item.titulo}</h2>
          <div className="mt-1 text-[11px] text-white/35">{formatDate(item.data)}</div>
          {item.descricao && (
            <div className="mt-2 text-sm leading-relaxed text-white/55 [&_a]:text-accent" dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.descricao) }} />
          )}
          {item.videoUrl && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setExpanded(true)} className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/75 transition hover:border-accent/40 hover:text-white">
                <Maximize2 className="h-3.5 w-3.5" /> Tela cheia
              </button>
            </div>
          )}
          <BioBox item={item} />
        </div>
      </article>
    </>
  );
}

// Card-playlist: várias aulas de um mesmo assunto. Uma lista de aulas troca o vídeo em cima.
function PlaylistCard({ grupo }: { grupo: Grupo }) {
  const [sel, setSel] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const aula = grupo.aulas[sel] ?? grupo.aulas[0];
  // O perfil (bio/QR) é do profissional — pega o primeiro que tiver preenchido.
  const perfil = grupo.aulas.find((a) => a.bio || a.qrLink || (a.links && a.links.length > 0)) ?? grupo.aulas[0];

  return (
    <>
      {expanded && <VideoModal item={aula} onClose={() => setExpanded(false)} />}
      <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
        {/* key força remontar ao trocar de aula → volta pra capa da aula nova */}
        <CardMedia key={aula.id} item={aula} onExpand={() => setExpanded(true)} />
        <div className="flex flex-1 flex-col p-5">
          <Credito medico={grupo.medico} especialidade={grupo.especialidade} />
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold leading-snug text-white">{grupo.assunto}</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/50">
              <Layers className="h-3 w-3" /> {grupo.aulas.length} aulas
            </span>
          </div>

          {/* Aula selecionada */}
          <p className="mt-2 text-sm font-medium text-white/85">{aula.titulo}</p>
          <div className="text-[11px] text-white/35">{formatDate(aula.data)}</div>
          {aula.descricao && (
            <div className="mt-2 text-sm leading-relaxed text-white/55 [&_a]:text-accent" dangerouslySetInnerHTML={{ __html: sanitizeRichText(aula.descricao) }} />
          )}

          {/* Lista de aulas */}
          <div className="mt-3 space-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-1.5">
            {grupo.aulas.map((a, idx) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSel(idx)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition ${idx === sel ? "bg-accent/15 text-white" : "text-white/65 hover:bg-white/[0.05]"}`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${idx === sel ? "bg-accent text-on-accent" : "bg-white/10 text-white/60"}`}>{idx + 1}</span>
                <span className="min-w-0 flex-1 truncate">{a.titulo}</span>
                {a.duracao && <span className="shrink-0 text-white/35">{a.duracao}</span>}
              </button>
            ))}
          </div>

          {aula.videoUrl && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setExpanded(true)} className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/75 transition hover:border-accent/40 hover:text-white">
                <Maximize2 className="h-3.5 w-3.5" /> Tela cheia
              </button>
            </div>
          )}

          <BioBox item={perfil} />
        </div>
      </article>
    </>
  );
}

type Grupo = {
  key: string;
  assunto: string;
  medico: string;
  especialidade: string;
  aulas: ColaboradorData[];
  recente: string;
};

// Agrupa aulas por (profissional + assunto). Aula sem assunto vira grupo de 1.
function agrupar(items: ColaboradorData[]): Grupo[] {
  const valid = items.filter((x) => x.titulo);
  const map = new Map<string, Grupo>();
  const ordem: string[] = [];
  for (const it of valid) {
    const assunto = (it.assunto ?? "").trim();
    const key = assunto
      ? `${(it.medico ?? "").trim().toLowerCase()}||${assunto.toLowerCase()}`
      : `solo::${it.id}`;
    let g = map.get(key);
    if (!g) {
      g = { key, assunto, medico: it.medico ?? "", especialidade: it.especialidade ?? "", aulas: [], recente: it.data ?? "" };
      map.set(key, g);
      ordem.push(key);
    }
    g.aulas.push(it);
    if ((it.data ?? "") > g.recente) g.recente = it.data ?? "";
  }
  const grupos = ordem.map((k) => map.get(k)!);
  // dentro do grupo: por data crescente (aula 1 primeiro), estável
  for (const g of grupos) g.aulas = [...g.aulas].sort((a, b) => (a.data ?? "").localeCompare(b.data ?? ""));
  // grupos: assunto mais recente primeiro
  grupos.sort((a, b) => b.recente.localeCompare(a.recente));
  return grupos;
}

export default function ColaboradoresList({ items, cols, limit }: { items: ColaboradorData[]; cols?: number; limit?: number }) {
  // Agrupa PRIMEIRO (por profissional+assunto) e só então limita por nº de CARDS —
  // assim um assunto com muitas aulas conta como 1 card e não engole a lista.
  const todos = agrupar(items);
  const grupos = limit ? todos.slice(0, limit) : todos;

  if (grupos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
        <p className="text-sm text-white/50">Em breve, materiais de profissionais parceiros.</p>
      </div>
    );
  }

  return (
    <div className="card-grid gap-5" style={colStyle(cols ?? 3)}>
      {grupos.map((g) =>
        g.aulas.length > 1
          ? <PlaylistCard key={g.key} grupo={g} />
          : <Card key={g.aulas[0].id} item={g.aulas[0]} />
      )}
    </div>
  );
}
