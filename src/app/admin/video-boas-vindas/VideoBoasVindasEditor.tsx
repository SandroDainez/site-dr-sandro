"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2 } from "lucide-react";
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

  const fileRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const yt = ytId(videoUrl);
  // Vídeo próprio (enviado): qualquer URL que não seja YouTube — servimos com <video>.
  const proprio = !!videoUrl && !yt;

  async function enviarArquivo(file: File) {
    setEnviando(true); setProgresso(0); setErr(null); setMsg(null);
    try {
      // Upload direto navegador → Vercel Blob (não passa pelo limite de 4,5 MB da função)
      const blob = await upload(`video-boas-vindas/${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
        onUploadProgress: ({ percentage }) => setProgresso(Math.round(percentage)),
      });
      // URL privada → proxy servível
      setVideoUrl(`/api/img?url=${encodeURIComponent(blob.url)}`);
      setMsg("Vídeo enviado. Agora clique em Salvar.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao enviar o vídeo.");
    } finally {
      setEnviando(false); setProgresso(0);
    }
  }

  function salvar() {
    setErr(null); setMsg(null);
    if (ativo && !videoUrl.trim()) { setErr("Envie um vídeo ou cole um link antes de ligar."); return; }
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

      {/* Enviar do computador */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className={labelCls}>Enviar um vídeo do seu computador</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={enviando}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-white/80 transition hover:border-accent/40 hover:text-white disabled:opacity-50"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {enviando ? `Enviando… ${progresso}%` : "Escolher vídeo (MP4, MOV…)"}
          </button>
          {proprio && !enviando && <span className="text-xs text-accent">✓ Vídeo carregado</span>}
        </div>
        {enviando && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent transition-all duration-200" style={{ width: `${progresso}%` }} />
          </div>
        )}
        <input
          type="file" accept="video/*" className="hidden" ref={fileRef}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarArquivo(f); e.target.value = ""; }}
        />
        <p className="mt-2 text-[11px] text-white/35">Grave no celular ou no computador e envie aqui (até ~2 GB). Fica hospedado no próprio site.</p>
      </div>

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-white/25">
        <span className="h-px flex-1 bg-white/10" /> ou <span className="h-px flex-1 bg-white/10" />
      </div>

      <div>
        <label className={labelCls}>Colar um link do YouTube</label>
        <input className={inputCls} value={yt || !videoUrl ? videoUrl : ""} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." disabled={proprio} />
        {proprio && <p className="mt-1 text-[11px] text-white/40">Você enviou um vídeo do computador. Para usar YouTube, <button type="button" onClick={() => setVideoUrl("")} className="underline hover:text-white/70">remover o vídeo enviado</button>.</p>}
      </div>

      <div>
        <label className={labelCls}>Título</label>
        <input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Bem-vindo ao MedCampus 👋" />
      </div>

      <div>
        <label className={labelCls}>Subtítulo (opcional)</label>
        <input className={inputCls} value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Em 1 minuto, o que tem aqui e como aproveitar." />
      </div>

      {/* Prévia */}
      {videoUrl && (
        <div>
          <p className="mb-1.5 text-xs uppercase tracking-[0.1em] text-white/45">Prévia</p>
          <div className="w-[300px] max-w-full overflow-hidden rounded-2xl border border-accent">
            {yt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="" className="aspect-video w-full object-cover" />
            ) : (
              <video src={videoUrl} className="aspect-video w-full bg-black object-cover" muted playsInline preload="metadata" />
            )}
            <div className="bg-[#141b2c] p-3.5">
              <p className="text-[13.5px] font-semibold text-white">{titulo || "Bem-vindo ao MedCampus 👋"}</p>
              {subtitulo && <p className="mt-0.5 text-[11.5px] text-white/55">{subtitulo}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={salvar} disabled={pending || enviando} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
          {pending ? "Salvando…" : "Salvar"}
        </button>
        {msg && <span className="text-sm text-accent">✓ {msg}</span>}
        {err && <span className="text-sm text-rose-300">{err}</span>}
      </div>
    </div>
  );
}
