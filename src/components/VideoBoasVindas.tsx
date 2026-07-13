"use client";

import { useEffect, useState } from "react";
import { Play, X, Video } from "lucide-react";
import type { VideoBoasVindasData } from "@/lib/content";
import { ytId, ytEmbed, ytThumb } from "@/lib/youtube";

// Vídeo de boas-vindas FLUTUANTE do Dr. Sandro. Abre sozinho ~900ms após carregar (mas dá
// pra ignorar/fechar). Quem fecha não vê de novo — MAS reaparece quando o admin troca o
// vídeo (versao nova). Sem autoplay com som: abre com play; o clique é que dá play.
const CHAVE = "medcampus_bv_fechado";

export default function VideoBoasVindas({ data }: { data: VideoBoasVindasData }) {
  const [aberto, setAberto] = useState(false);
  const [reabrir, setReabrir] = useState(false);
  const [tocando, setTocando] = useState(false);

  const ativo = data.ativo && !!data.videoUrl;
  const yt = ativo ? ytId(data.videoUrl) : null;
  const proprio = ativo && !yt; // vídeo enviado (hospedado no site) → toca com <video>

  useEffect(() => {
    if (!ativo) return;
    let fechadoNaVersao = "";
    try { fechadoNaVersao = localStorage.getItem(CHAVE) ?? ""; } catch { /* ignore */ }
    // Já fechou ESTA versão → não abre sozinho, só deixa o ícone de reabrir.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fechadoNaVersao === data.versao) { setReabrir(true); return; }
    const t = setTimeout(() => setAberto(true), 900);
    return () => clearTimeout(t);
  }, [ativo, data.versao]);

  if (!ativo) return null;

  function fechar() {
    setAberto(false);
    setTocando(false);
    setReabrir(true);
    try { localStorage.setItem(CHAVE, data.versao); } catch { /* ignore */ }
  }
  function abrir() { setReabrir(false); setAberto(true); }
  function darPlay() {
    if (yt || proprio) setTocando(true);
    else window.open(data.videoUrl, "_blank", "noopener");
  }

  if (reabrir && !aberto) {
    return (
      <button
        type="button" onClick={abrir}
        className="fixed bottom-4 right-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-accent/50 bg-[#141b2c] text-accent shadow-lg transition hover:scale-105"
        title="Ver o vídeo de boas-vindas"
        aria-label="Ver o vídeo de boas-vindas"
      >
        <Video className="h-5 w-5" />
      </button>
    );
  }

  if (!aberto) return null;

  return (
    <div className="fixed right-3 top-24 z-[60] w-[300px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-accent bg-[#141b2c] shadow-[0_18px_50px_rgba(0,0,0,0.55)] sm:right-4">
      <button type="button" onClick={fechar} aria-label="Fechar" className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75">
        <X className="h-4 w-4" />
      </button>

      {tocando && yt ? (
        <div className="aspect-video w-full bg-black">
          <iframe src={ytEmbed(yt)} title={data.titulo} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" />
        </div>
      ) : tocando && proprio ? (
        <div className="aspect-video w-full bg-black">
          <video src={data.videoUrl} controls autoPlay playsInline className="h-full w-full" />
        </div>
      ) : (
        <button type="button" onClick={darPlay} className="group relative block aspect-video w-full">
          {yt ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ytThumb(yt)} alt="" className="h-full w-full object-cover" />
          ) : proprio ? (
            <video src={data.videoUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(80%_100%_at_50%_0%,rgba(44,230,184,0.28),#0b0f18)]" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/40">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-[#04231c] shadow-lg transition group-hover:scale-110">
              <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
            </span>
          </div>
        </button>
      )}

      <div className="p-3.5">
        <p className="text-[13.5px] font-semibold text-white">{data.titulo}</p>
        {data.subtitulo && <p className="mt-0.5 text-[11.5px] text-white/55">{data.subtitulo}</p>}
        {!tocando && <button type="button" onClick={fechar} className="mt-2 text-[11px] text-white/40 underline transition hover:text-white/60">Agora não, obrigado</button>}
      </div>
    </div>
  );
}
