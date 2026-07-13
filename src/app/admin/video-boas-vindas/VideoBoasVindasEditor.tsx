"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveVideoBoasVindas } from "@/app/admin/actions";
import type { VideoBoasVindasData } from "@/lib/content";
import { ytId } from "@/lib/youtube";

const inputCls = "w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/45";

export default function VideoBoasVindasEditor({ initial }: { initial: VideoBoasVindasData }) {
  const router = useRouter();
  const [ativo, setAtivo] = useState(initial.ativo);
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl);
  const [titulo, setTitulo] = useState(initial.titulo);
  const [subtitulo, setSubtitulo] = useState(initial.subtitulo);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const yt = ytId(videoUrl);
  const linkValido = !videoUrl || !!yt;

  function salvar() {
    setErr(null); setMsg(null);
    if (ativo && !videoUrl.trim()) { setErr("Cole o link do vídeo antes de ligar."); return; }
    if (videoUrl && !yt) { setErr("Link não reconhecido como YouTube. Use um link do YouTube (youtube.com/watch ou youtu.be)."); return; }
    start(async () => {
      const r = await saveVideoBoasVindas({ ativo, videoUrl: videoUrl.trim(), titulo: titulo.trim() || "Bem-vindo ao MedCampus 👋", subtitulo: subtitulo.trim() });
      if (r.ok) { setMsg("Salvo. Ele vai reaparecer pra todo mundo (recado novo)."); router.refresh(); }
      else setErr(r.error);
    });
  }

  return (
    <div className="space-y-5">
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-5 w-5 accent-accent" />
        <span className="text-sm font-medium text-white">Mostrar o vídeo de boas-vindas no site</span>
      </label>

      <div>
        <label className={labelCls}>Link do vídeo (YouTube)</label>
        <input className={inputCls} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
        {!linkValido && <p className="mt-1 text-[11px] text-rose-300">Use um link do YouTube.</p>}
      </div>

      <div>
        <label className={labelCls}>Título</label>
        <input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Bem-vindo ao MedCampus 👋" />
      </div>

      <div>
        <label className={labelCls}>Subtítulo (opcional)</label>
        <input className={inputCls} value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Em 1 minuto, o que tem aqui e como aproveitar." />
      </div>

      {/* Prévia da capa */}
      {yt && (
        <div>
          <p className="mb-1.5 text-xs uppercase tracking-[0.1em] text-white/45">Prévia</p>
          <div className="w-[300px] max-w-full overflow-hidden rounded-2xl border border-accent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="" className="aspect-video w-full object-cover" />
            <div className="bg-[#141b2c] p-3.5">
              <p className="text-[13.5px] font-semibold text-white">{titulo || "Bem-vindo ao MedCampus 👋"}</p>
              {subtitulo && <p className="mt-0.5 text-[11.5px] text-white/55">{subtitulo}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={salvar} disabled={pending} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
          {pending ? "Salvando…" : "Salvar"}
        </button>
        {msg && <span className="text-sm text-accent">✓ {msg}</span>}
        {err && <span className="text-sm text-rose-300">{err}</span>}
      </div>
    </div>
  );
}
