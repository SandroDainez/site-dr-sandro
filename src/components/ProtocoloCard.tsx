"use client";

import { useState, useEffect } from "react";
import type { ProtocoloData } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";

// Card de protocolo reutilizável: mesma experiência no /protocolos (geral),
// nos hubs por especialidade e no "Todo o conteúdo". Cada card cuida do próprio
// estado (ler texto, ler PDF inline, tela cheia) — abrir é igual em todo lugar.

const areaBadge: Record<ProtocoloData["area"], string> = {
  emergencias: "bg-emerg/15 text-emerg border-emerg/30",
  ti: "bg-inten/15 text-inten border-inten/30",
  anestesiologia: "bg-anest/15 text-anest border-anest/30",
};
const areaLabel: Record<ProtocoloData["area"], string> = {
  emergencias: "Emergências",
  ti: "Terapia Intensiva",
  anestesiologia: "Anestesiologia",
};

function formatDate(iso: string): string {
  try {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function ProtocoloCard({ item }: { item: ProtocoloData }) {
  const [expanded, setExpanded] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [full, setFull] = useState<null | "pdf" | "text">(null);

  // Abre automaticamente se a URL aponta para este protocolo (#id), vindo de outra página.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace("#", ""));
    if (id && id === item.id) {
      setExpanded(true);
      setTimeout(() => document.getElementById(`protocolo-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fecha a tela cheia com Esc + trava o scroll do fundo
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [full]);

  return (
    <article
      id={`protocolo-${item.id}`}
      className="scroll-mt-24 flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20"
    >
      <span className={`self-start rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${areaBadge[item.area]}`}>
        {areaLabel[item.area]}
      </span>

      {item.imageUrl && (
        <div className="mt-4">
          {/* respeita o "Tamanho da imagem no site" (imageSize, px) — centralizada e limitada à largura do card */}
          <div className="flex justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async" src={item.imageUrl} alt={item.imageCaption || item.titulo} style={{ width: `${item.imageSize ?? 176}px`, maxWidth: "100%" }} className="h-auto object-contain" />
          </div>
          {item.imageCaption && <p className="mt-1.5 text-center text-xs leading-relaxed text-white/40">{item.imageCaption}</p>}
        </div>
      )}

      <p className="mt-4 text-xs text-white/40">{formatDate(item.data)}</p>
      <h2 className="mt-2 text-lg font-semibold leading-snug tracking-tight text-white">{item.titulo}</h2>

      {item.descricao && (
        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-white/60" dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.descricao) }} />
      )}

      {item.conteudo && (
        <div className="mt-4">
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs font-medium text-accent/80 transition hover:text-accent">
            {expanded ? "Fechar protocolo ↑" : "Ver protocolo ↓"}
          </button>
          {expanded && (
            <pre
              className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-relaxed text-white/70"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.conteudo) }}
            />
          )}
        </div>
      )}

      {item.arquivoUrl && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPdfOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-4 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25">
              {pdfOpen ? "Fechar leitura ↑" : "📄 Ler protocolo"}
            </button>
            <button type="button" onClick={() => setFull("pdf")} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/70 transition hover:border-accent/40 hover:text-white">
              ⛶ Tela cheia
            </button>
            <a href={item.arquivoUrl} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/70 transition hover:border-accent/40 hover:text-white">
              {item.arquivoLabel || "Baixar PDF"} ↓
            </a>
          </div>
          {pdfOpen && (
            <iframe src={item.arquivoUrl} title={item.titulo} allowFullScreen className="mt-3 w-full rounded-xl border border-white/10 bg-white" style={{ height: "78vh" }} />
          )}
        </div>
      )}

      {full && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 p-3 backdrop-blur-sm sm:p-5">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <h3 className="min-w-0 truncate text-base font-semibold text-white">{item.titulo}</h3>
            <div className="flex shrink-0 items-center gap-2">
              {full === "pdf" && item.arquivoUrl && (
                <a href={item.arquivoUrl} target="_blank" rel="noreferrer" download className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/15">
                  Baixar ↓
                </a>
              )}
              <button type="button" onClick={() => setFull(null)} className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25">
                ✕ Fechar (Esc)
              </button>
            </div>
          </div>
          {full === "pdf" && item.arquivoUrl ? (
            <iframe src={`${item.arquivoUrl}#view=FitH`} title={item.titulo} className="min-h-0 w-full flex-1 rounded-xl bg-white" />
          ) : (
            <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/10 bg-black/40 p-5">
              {item.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img loading="lazy" decoding="async" src={item.imageUrl} alt={item.imageCaption || item.titulo} className="mx-auto mb-5 max-h-[78vh] w-auto rounded-xl object-contain" />
              )}
              {item.conteudo && (
                <pre className="whitespace-pre-wrap font-mono text-base leading-relaxed text-white/85" dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.conteudo) }} />
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
