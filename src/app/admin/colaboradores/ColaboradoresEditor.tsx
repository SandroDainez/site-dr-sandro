"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, Upload, Loader2, X, UserPlus } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { ColaboradorData } from "@/lib/content";
import { saveColaboradores } from "@/app/admin/actions";
import RichTextEditor from "@/components/admin/RichTextEditor";

type Props = { initialItems: ColaboradorData[] };

const inputCls =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/40";

function uid() {
  return `colab-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}

export default function ColaboradoresEditor({ initialItems }: Props) {
  const [items, setItems] = useState<ColaboradorData[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  function update(i: number, patch: Partial<ColaboradorData>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
    setSaved(false);
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: uid(), titulo: "", descricao: "", medico: "", especialidade: "", videoUrl: "", imageUrl: "", duracao: "", data: new Date().toISOString().slice(0, 10), bio: "", links: [] },
    ]);
    setSaved(false);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  function addLink(i: number) {
    update(i, { links: [...(items[i].links ?? []), { id: `lnk-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`, label: "", url: "" }] });
  }
  function updateLink(i: number, linkId: string, patch: Partial<{ label: string; url: string }>) {
    update(i, { links: (items[i].links ?? []).map((l) => (l.id === linkId ? { ...l, ...patch } : l)) });
  }
  function removeLink(i: number, linkId: string) {
    update(i, { links: (items[i].links ?? []).filter((l) => l.id !== linkId) });
  }

  async function handleUpload(key: string, file: File, apply: (url: string) => void) {
    setError(null);
    setUploadingKey(key);
    try {
      const blob = await upload(`colaboradores/${Date.now()}-${file.name}`, file, {
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
      const r = await saveColaboradores(items);
      if (r.ok) setSaved(true);
      else setError(r.error);
    });
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const upVideo = uploadingKey === `video-${i}`;
        const upThumb = uploadingKey === `thumb-${i}`;
        const isProxy = item.videoUrl.startsWith("/api/img");
        const yt = ytId(item.videoUrl);
        return (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/40">
                <UserPlus className="h-3.5 w-3.5" /> Material {i + 1}
              </span>
              <button type="button" onClick={() => removeItem(i)} className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20">
                <Trash2 className="h-3 w-3" /> Remover
              </button>
            </div>

            {/* Profissional que cedeu o material */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Profissional (nome)</label>
                <input className={inputCls} value={item.medico} onChange={(e) => update(i, { medico: e.target.value })} placeholder="Dra. Ana Souza" />
              </div>
              <div>
                <label className={labelCls}>Especialidade</label>
                <input className={inputCls} value={item.especialidade} onChange={(e) => update(i, { especialidade: e.target.value })} placeholder="Cardiologia" />
              </div>
            </div>

            {/* Sobre o profissional — opcional (bio + contatos/redes p/ divulgação) */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
              <p className="text-xs uppercase tracking-[0.1em] text-white/40">Sobre o profissional <span className="normal-case text-white/30">(opcional — preencha se ele quiser divulgação)</span></p>
              <div>
                <label className={labelCls}>Mini-bio</label>
                <textarea className={inputCls + " min-h-[64px] resize-y"} value={item.bio ?? ""} onChange={(e) => update(i, { bio: e.target.value })} placeholder="Breve apresentação do profissional, onde atua, etc." />
              </div>
              <div>
                <label className={labelCls}>Contatos / redes / site</label>
                <div className="space-y-2">
                  {(item.links ?? []).map((l) => (
                    <div key={l.id} className="flex gap-2">
                      <input className={inputCls + " sm:w-40"} value={l.label} onChange={(e) => updateLink(i, l.id, { label: e.target.value })} placeholder="Instagram" />
                      <input className={inputCls} value={l.url} onChange={(e) => updateLink(i, l.id, { url: e.target.value })} placeholder="https://instagram.com/..." />
                      <button type="button" onClick={() => removeLink(i, l.id)} className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 text-red-400 transition hover:bg-red-500/20" title="Remover"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addLink(i)} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:border-accent/40 hover:text-white">
                    <Plus className="h-3.5 w-3.5" /> Adicionar link (Instagram, site, WhatsApp...)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <label className={labelCls}>Título do vídeo</label>
                <input className={inputCls} value={item.titulo} onChange={(e) => update(i, { titulo: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Duração</label>
                <input className={inputCls + " w-28"} value={item.duracao} onChange={(e) => update(i, { duracao: e.target.value })} placeholder="12 min" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Descrição</label>
              <RichTextEditor value={item.descricao} onChange={(html) => update(i, { descricao: html })} />
            </div>

            {/* Vídeo: upload ou YouTube */}
            <div className="rounded-xl border border-accent/30 bg-accent/[0.05] p-3">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-accent">🎬 Vídeo</label>
              <input
                className={inputCls}
                value={item.videoUrl}
                onChange={(e) => update(i, { videoUrl: e.target.value })}
                placeholder="Cole o link do YouTube — ou envie o arquivo →"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input type="file" accept="video/*" id={`video-${i}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(`video-${i}`, f, (url) => update(i, { videoUrl: url })); e.target.value = ""; }} />
                <label htmlFor={`video-${i}`} className={`flex cursor-pointer items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20 ${upVideo ? "pointer-events-none opacity-50" : ""}`}>
                  {upVideo ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</> : <><Upload className="h-3.5 w-3.5" /> Enviar vídeo do PC</>}
                </label>
                {isProxy && item.videoUrl && <span className="text-[11px] text-white/50">✓ Vídeo enviado</span>}
                {yt && <span className="text-[11px] text-white/50">🎬 YouTube</span>}
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <label className={labelCls}>Thumbnail (opcional)</label>
              <div className="flex items-center gap-3">
                {item.imageUrl ? (
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => update(i, { imageUrl: "" })} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white" title="Remover"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/20 text-white/30 text-[10px]">thumb</div>
                )}
                <input type="file" accept="image/*" id={`thumb-${i}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(`thumb-${i}`, f, (url) => update(i, { imageUrl: url })); e.target.value = ""; }} />
                <label htmlFor={`thumb-${i}`} className={`flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-3 py-1.5 text-xs text-white transition hover:bg-white/10 ${upThumb ? "pointer-events-none opacity-50" : ""}`}>
                  {upThumb ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</> : <><Upload className="h-3.5 w-3.5" /> Enviar thumbnail</>}
                </label>
              </div>
            </div>

            <div>
              <label className={labelCls}>Data</label>
              <input type="date" className={inputCls + " w-44"} value={item.data} onChange={(e) => update(i, { data: e.target.value })} />
            </div>
          </div>
        );
      })}

      <button type="button" onClick={addItem} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm text-white/50 transition hover:border-accent/40 hover:text-accent">
        <Plus className="h-4 w-4" /> Adicionar material de parceiro
      </button>

      <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0e14]/90 p-3 backdrop-blur">
        <button type="button" onClick={handleSave} disabled={isPending} className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50">
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar parceiros"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
