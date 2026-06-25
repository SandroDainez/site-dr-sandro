"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, Upload, Loader2, X, Mic } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { PodcastData } from "@/lib/content";
import { savePodcasts } from "@/app/admin/actions";
import RichTextEditor from "@/components/admin/RichTextEditor";

type Props = { initialPodcasts: PodcastData[] };

const inputCls =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/40";

function uid() {
  return `pod-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export default function PodcastEditor({ initialPodcasts }: Props) {
  const [items, setItems] = useState<PodcastData[]>(initialPodcasts);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  function update(i: number, patch: Partial<PodcastData>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
    setSaved(false);
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: uid(), titulo: "", descricao: "", imageUrl: "", audioUrl: "", embedUrl: "", duracao: "", data: new Date().toISOString().slice(0, 10) },
    ]);
    setSaved(false);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  async function handleUpload(key: string, file: File, apply: (url: string) => void) {
    setError(null);
    setUploadingKey(key);
    try {
      const blob = await upload(`podcast/${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      });
      apply(`/api/img?url=${encodeURIComponent(blob.url)}`);
    } catch (e) {
      setError("Falha no upload: " + String(e instanceof Error ? e.message : e));
    } finally {
      setUploadingKey(null);
    }
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const r = await savePodcasts(items);
      if (r.ok) setSaved(true);
      else setError(r.error);
    });
  }

  return (
    <div className="space-y-4">
      {items.map((ep, i) => {
        const upCover = uploadingKey === `cover-${i}`;
        const upAudio = uploadingKey === `audio-${i}`;
        return (
          <div key={ep.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/40">
                <Mic className="h-3.5 w-3.5" /> Episódio {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20"
              >
                <Trash2 className="h-3 w-3" /> Remover
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <label className={labelCls}>Título</label>
                <input className={inputCls} value={ep.titulo} onChange={(e) => update(i, { titulo: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Duração</label>
                <input className={inputCls + " w-28"} value={ep.duracao} onChange={(e) => update(i, { duracao: e.target.value })} placeholder="32 min" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Descrição</label>
              <RichTextEditor value={ep.descricao} onChange={(html) => update(i, { descricao: html })} />
            </div>

            {/* Capa */}
            <div>
              <label className={labelCls}>Capa do episódio (opcional)</label>
              <div className="flex items-center gap-3">
                {ep.imageUrl ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ep.imageUrl} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => update(i, { imageUrl: "" })} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white" title="Remover">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/20 text-white/30 text-[10px]">capa</div>
                )}
                <input type="file" accept="image/*" id={`cover-${i}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(`cover-${i}`, f, (url) => update(i, { imageUrl: url })); e.target.value = ""; }} />
                <label htmlFor={`cover-${i}`} className={`flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-3 py-1.5 text-xs text-white transition hover:bg-white/10 ${upCover ? "pointer-events-none opacity-50" : ""}`}>
                  {upCover ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</> : <><Upload className="h-3.5 w-3.5" /> Enviar capa</>}
                </label>
              </div>
            </div>

            {/* Áudio enviado (gravação do PC) */}
            <div className="rounded-xl border border-accent/30 bg-accent/[0.05] p-3">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-accent">🎙️ Sua gravação (enviar áudio do PC)</label>
              <div className="flex flex-wrap items-center gap-3">
                <input type="file" accept="audio/*" id={`audio-${i}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(`audio-${i}`, f, (url) => update(i, { audioUrl: url })); e.target.value = ""; }} />
                <label htmlFor={`audio-${i}`} className={`flex cursor-pointer items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20 ${upAudio ? "pointer-events-none opacity-50" : ""}`}>
                  {upAudio ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</> : <><Upload className="h-3.5 w-3.5" /> Enviar áudio (mp3, m4a, wav)</>}
                </label>
                {ep.audioUrl && (
                  <>
                    <span className="text-[11px] text-white/50">✓ Áudio enviado</span>
                    <button type="button" onClick={() => update(i, { audioUrl: "" })} className="text-[11px] text-red-400/70 hover:text-red-400">remover</button>
                  </>
                )}
              </div>
              {ep.audioUrl && <audio controls src={ep.audioUrl} className="mt-3 w-full" />}
            </div>

            {/* Link externo */}
            <div>
              <label className={labelCls}>Ou cole um link (Spotify / YouTube / Apple Podcasts)</label>
              <input className={inputCls} value={ep.embedUrl} onChange={(e) => update(i, { embedUrl: e.target.value })} placeholder="https://open.spotify.com/episode/..." />
              <p className="mt-1 text-[11px] text-white/40">
                Pode usar áudio enviado <strong>e/ou</strong> link. Spotify e YouTube tocam embutidos no site; outros viram botão “Ouvir”.
              </p>
            </div>

            <div>
              <label className={labelCls}>Data</label>
              <input type="date" className={inputCls + " w-44"} value={ep.data} onChange={(e) => update(i, { data: e.target.value })} />
            </div>
          </div>
        );
      })}

      <button type="button" onClick={addItem} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm text-white/50 transition hover:border-accent/40 hover:text-accent">
        <Plus className="h-4 w-4" /> Adicionar episódio
      </button>

      <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0e14]/90 p-3 backdrop-blur">
        <button type="button" onClick={handleSave} disabled={isPending} className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50">
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar podcast"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
