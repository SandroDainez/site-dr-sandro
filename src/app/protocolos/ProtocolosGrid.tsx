"use client";

import { useState, useEffect } from "react";
import type { ProtocoloData } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";

type Props = {
  protocolos: ProtocoloData[];
};

type FilterArea = "todos" | ProtocoloData["area"];

const tabs: { value: FilterArea; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "emergencias", label: "Emergências" },
  { value: "ti", label: "TI" },
  { value: "anestesiologia", label: "Anestesiologia" },
];

const areaBadge: Record<ProtocoloData["area"], string> = {
  emergencias: "bg-red-400/15 text-red-400 border-red-400/30",
  ti: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  anestesiologia: "bg-violet-400/15 text-violet-400 border-violet-400/30",
};

const areaLabel: Record<ProtocoloData["area"], string> = {
  emergencias: "Emergências",
  ti: "Terapia Intensiva",
  anestesiologia: "Anestesiologia",
};

function formatDate(iso: string): string {
  try {
    const [year, month, day] = iso.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ProtocolosGrid({ protocolos }: Props) {
  const [active, setActive] = useState<FilterArea>("todos");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pdfOpen, setPdfOpen] = useState<Set<string>>(new Set());
  const [full, setFull] = useState<{ id: string; mode: "pdf" | "text" } | null>(null);

  // fecha a leitura em tela cheia com Esc + trava o scroll do fundo
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [full]);

  function togglePdf(id: string) {
    setPdfOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sorted = [...protocolos].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const filtered =
    active === "todos" ? sorted : sorted.filter((p) => p.area === active);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Abre automaticamente o protocolo apontado pela URL (#id), vindo da home.
  // Roda SÓ UMA VEZ no mount — senão re-abria quando o usuário tentava recolher.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace("#", ""));
    if (!id || !protocolos.some((p) => p.id === id)) return;
    setExpanded((prev) => new Set(prev).add(id));
    setTimeout(() => {
      document.getElementById(`protocolo-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <p className="text-sm text-white/40">Nenhum protocolo nesta área ainda.</p>
      )}

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const isExpanded = expanded.has(item.id);
          return (
            <article
              key={item.id}
              id={`protocolo-${item.id}`}
              className="scroll-mt-24 flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20"
            >
              {/* Area badge */}
              <span
                className={`self-start rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${areaBadge[item.area]}`}
              >
                {areaLabel[item.area]}
              </span>

              {/* Image */}
              {item.imageUrl && (
                <div className="mt-4">
                  {/* Infográfico de fundo escuro — sem painel branco; o fundo escuro funde no card */}
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                    <img loading="lazy" decoding="async"
                      src={item.imageUrl}
                      alt={item.imageCaption || item.titulo}
                      className="aspect-square w-full object-contain"
                    />
                  </div>
                  {item.imageCaption && (
                    <p className="mt-1.5 text-xs text-white/40 leading-relaxed">
                      {item.imageCaption}
                    </p>
                  )}
                </div>
              )}

              {/* Date */}
              <p className="mt-4 text-xs text-white/40">{formatDate(item.data)}</p>

              {/* Title */}
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-white leading-snug">
                {item.titulo}
              </h2>

              {/* Descrição */}
              <p
                className="mt-3 text-sm leading-relaxed text-white/60 line-clamp-2 flex-1"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.descricao) }}
              />

              {/* Ver protocolo toggle */}
              {item.conteudo && (
                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="text-xs font-medium text-accent/80 transition hover:text-accent"
                    >
                      {isExpanded ? "Fechar protocolo ↑" : "Ver protocolo ↓"}
                    </button>
                  </div>
                  {isExpanded && (
                    <pre
                      className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-white/70 font-mono"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.conteudo) }}
                    />
                  )}
                </div>
              )}

              {/* Arquivo / PDF — ler no site ou baixar */}
              {item.arquivoUrl && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => togglePdf(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/40 px-4 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25"
                    >
                      {pdfOpen.has(item.id) ? "Fechar leitura ↑" : "📄 Ler protocolo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFull({ id: item.id, mode: "pdf" })}
                      className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/70 transition hover:border-accent/40 hover:text-white"
                    >
                      ⛶ Tela cheia
                    </button>
                    <a
                      href={item.arquivoUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/70 transition hover:border-accent/40 hover:text-white"
                    >
                      {item.arquivoLabel || "Baixar PDF"} ↓
                    </a>
                  </div>
                  {pdfOpen.has(item.id) && (
                    <iframe
                      id={`pdf-${item.id}`}
                      src={item.arquivoUrl}
                      title={item.titulo}
                      allowFullScreen
                      className="mt-3 w-full rounded-xl border border-white/10 bg-white"
                      style={{ height: "78vh" }}
                    />
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Leitura em tela cheia (PDF grande ou texto grande) */}
      {full && (() => {
        const p = protocolos.find((x) => x.id === full.id);
        if (!p) return null;
        return (
          <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 p-3 backdrop-blur-sm sm:p-5">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
              <h3 className="min-w-0 truncate text-base font-semibold text-white">{p.titulo}</h3>
              <div className="flex shrink-0 items-center gap-2">
                {full.mode === "pdf" && p.arquivoUrl && (
                  <a
                    href={p.arquivoUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/15"
                  >
                    Baixar ↓
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setFull(null)}
                  className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
                >
                  ✕ Fechar (Esc)
                </button>
              </div>
            </div>
            {full.mode === "pdf" && p.arquivoUrl ? (
              <iframe
                src={`${p.arquivoUrl}#view=FitH`}
                title={p.titulo}
                className="min-h-0 w-full flex-1 rounded-xl bg-white"
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/10 bg-black/40 p-5">
                {/* Infográfico (o protocolo visual) */}
                {p.imageUrl && (
                  <img loading="lazy" decoding="async"
                    src={p.imageUrl}
                    alt={p.imageCaption || p.titulo}
                    className="mx-auto mb-5 max-h-[78vh] w-auto rounded-xl object-contain"
                  />
                )}
                {/* Texto do protocolo */}
                {p.conteudo && (
                  <pre
                    className="whitespace-pre-wrap text-base leading-relaxed text-white/85 font-mono"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(p.conteudo) }}
                  />
                )}
                {/* PDF completo */}
                {p.arquivoUrl && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFull({ id: p.id, mode: "pdf" })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/25"
                    >
                      📄 Abrir PDF completo
                    </button>
                    <a
                      href={p.arquivoUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 transition hover:border-accent/40 hover:text-white"
                    >
                      {p.arquivoLabel || "Baixar PDF"} ↓
                    </a>
                  </div>
                )}
                {!p.imageUrl && !p.conteudo && !p.arquivoUrl && (
                  <p className="text-sm text-white/40">Conteúdo em preparação.</p>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
