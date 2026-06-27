"use client";

import { useState, useTransition, useRef } from "react";
import { Plus, Trash2, Save, Upload, Loader2, X, FileText, BookOpen, Video, ImageIcon, File } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { AcervoItemData, AcervoArquivo } from "@/lib/content";
import { saveAcervo } from "@/app/admin/actions";
import RichTextEditor from "@/components/admin/RichTextEditor";
import AreasExtra from "@/components/admin/AreasExtra";

type SaveResult = { ok: true } | { ok: false; error: string };
type Props = {
  initialItens: AcervoItemData[];
  onSave?: (items: AcervoItemData[]) => Promise<SaveResult>;
  uploadPrefix?: string;
  saveLabel?: string;
};

const inputCls =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/40";

const tipoOpts: { v: AcervoArquivo["tipo"]; l: string; icon: typeof FileText }[] = [
  { v: "pdf", l: "PDF", icon: FileText },
  { v: "livro", l: "Livro (PDF)", icon: BookOpen },
  { v: "video", l: "Vídeo", icon: Video },
  { v: "imagem", l: "Imagem", icon: ImageIcon },
  { v: "arquivo", l: "Arquivo", icon: File },
];

function uid(p: string) {
  return `${p}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export default function AcervoEditor({ initialItens, onSave = saveAcervo, uploadPrefix = "acervo", saveLabel = "Salvar acervo" }: Props) {
  const [itens, setItens] = useState<AcervoItemData[]>(initialItens);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const pending = useRef<{ key: string; accept: string; apply: (url: string) => void } | null>(null);

  function touch() { setSaved(false); }
  function update(i: number, patch: Partial<AcervoItemData>) {
    setItens((p) => p.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
    touch();
  }
  function addItem() {
    setItens((p) => [...p, { id: uid("ac"), titulo: "", area: "geral", categoria: "", descricao: "", capaUrl: "", videoUrl: "", arquivos: [], data: new Date().toISOString().slice(0, 10), areas: [] }]);
    touch();
  }
  function removeItem(i: number) {
    if (!confirm("Remover este item do acervo?")) return;
    setItens((p) => p.filter((_, idx) => idx !== i));
    touch();
  }

  // arquivos
  function setArqs(i: number, fn: (a: AcervoArquivo[]) => AcervoArquivo[]) {
    setItens((p) => p.map((it, idx) => (idx === i ? { ...it, arquivos: fn(it.arquivos) } : it)));
    touch();
  }
  function addArq(i: number, tipo: AcervoArquivo["tipo"]) {
    setArqs(i, (a) => [...a, { id: uid("arq"), tipo, titulo: "", url: "" }]);
  }
  function updArq(i: number, ai: number, patch: Partial<AcervoArquivo>) {
    setArqs(i, (a) => a.map((x, idx) => (idx === ai ? { ...x, ...patch } : x)));
  }
  function rmArq(i: number, ai: number) {
    setArqs(i, (a) => a.filter((_, idx) => idx !== ai));
  }

  function pickFile(key: string, accept: string, apply: (url: string) => void) {
    pending.current = { key, accept, apply };
    if (fileInput.current) { fileInput.current.accept = accept; fileInput.current.click(); }
  }
  async function onFile(file: File) {
    const job = pending.current;
    if (!job) return;
    setError(null);
    setUploadingKey(job.key);
    try {
      const blob = await upload(`${uploadPrefix}/${Date.now()}-${file.name}`, file, { access: "private", handleUploadUrl: "/api/upload" });
      job.apply(`/api/img?url=${encodeURIComponent(blob.url)}`);
    } catch (e) {
      setError("Falha no upload: " + String(e instanceof Error ? e.message : e));
    } finally { setUploadingKey(null); pending.current = null; }
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const r = await onSave(itens);
      if (r.ok) setSaved(true); else setError(r.error);
    });
  }

  return (
    <div className="space-y-4">
      <input type="file" ref={fileInput} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />

      {itens.map((it, i) => (
        <div key={it.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.12em] text-white/40">Item {i + 1}</span>
            <button type="button" onClick={() => removeItem(i)} className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20">
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          </div>

          <div>
            <label className={labelCls}>Título</label>
            <input className={inputCls} value={it.titulo} onChange={(e) => update(i, { titulo: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Especialidade (aparece no hub da área)</label>
              <select className={inputCls} value={it.area ?? "geral"} onChange={(e) => update(i, { area: e.target.value as AcervoItemData["area"] })}>
                <option value="geral">Geral (sem especialidade)</option>
                <option value="emergencias">Emergências</option>
                <option value="ti">Terapia Intensiva</option>
                <option value="anestesiologia">Anestesiologia</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Categoria (badge livre)</label>
              <input className={inputCls} value={it.categoria} placeholder="Curiosidades, Documento, Protocolo..." onChange={(e) => update(i, { categoria: e.target.value })} />
            </div>
          </div>

          <AreasExtra value={it.areas} primary={it.area} onChange={(areas) => update(i, { areas })} />

          {/* Capa */}
          <div>
            <label className={labelCls}>Capa / foto (opcional)</label>
            <div className="flex items-center gap-3">
              {it.capaUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.capaUrl} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => update(i, { capaUrl: "" })} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/20 text-white/30 text-[10px]">capa</div>
              )}
              <button type="button" disabled={uploadingKey === `capa-${i}`} onClick={() => pickFile(`capa-${i}`, "image/*", (url) => update(i, { capaUrl: url }))} className="flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-3 py-1.5 text-xs text-white transition hover:bg-white/10 disabled:opacity-50">
                {uploadingKey === `capa-${i}` ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</> : <><Upload className="h-3.5 w-3.5" /> Enviar capa</>}
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className={labelCls}>Texto / descrição</label>
            <RichTextEditor value={it.descricao} onChange={(html) => update(i, { descricao: html })} />
          </div>

          {/* Vídeo destaque */}
          <div>
            <label className={labelCls}>Vídeo em destaque (opcional)</label>
            <div className="flex items-center gap-2">
              <input className={inputCls} value={it.videoUrl} placeholder="Link do YouTube ou envie o vídeo →" onChange={(e) => update(i, { videoUrl: e.target.value })} />
              <button type="button" disabled={uploadingKey === `vid-${i}`} onClick={() => pickFile(`vid-${i}`, "video/*", (url) => update(i, { videoUrl: url }))} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white/70 transition hover:border-accent/40 hover:text-white disabled:opacity-50">
                {uploadingKey === `vid-${i}` ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>

          {/* Arquivos para download */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent/80">Arquivos para baixar ({it.arquivos.length})</p>
            <div className="space-y-2">
              {it.arquivos.map((arq, ai) => {
                const up = uploadingKey === `arq-${i}-${ai}`;
                const accept = arq.tipo === "imagem" ? "image/*" : arq.tipo === "video" ? "video/*" : arq.tipo === "pdf" || arq.tipo === "livro" ? "application/pdf" : "*/*";
                return (
                  <div key={arq.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <select className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white outline-none" value={arq.tipo} onChange={(e) => updArq(i, ai, { tipo: e.target.value as AcervoArquivo["tipo"] })}>
                        {tipoOpts.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                      </select>
                      <input className={inputCls + " flex-1"} value={arq.titulo} placeholder="Nome do arquivo" onChange={(e) => updArq(i, ai, { titulo: e.target.value })} />
                      <button type="button" onClick={() => rmArq(i, ai)} className="rounded p-1 text-white/40 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input className={inputCls + " flex-1"} value={arq.url} placeholder="Link ou envie o arquivo →" onChange={(e) => updArq(i, ai, { url: e.target.value })} />
                      <button type="button" disabled={up} onClick={() => pickFile(`arq-${i}-${ai}`, accept, (url) => updArq(i, ai, { url }))} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white/70 transition hover:border-accent/40 hover:text-white disabled:opacity-50">
                        <Upload className="h-3.5 w-3.5" /> {up ? "Enviando..." : "Enviar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tipoOpts.map((t) => (
                <button key={t.v} type="button" onClick={() => addArq(i, t.v)} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-xs text-white/60 transition hover:border-accent/40 hover:text-white">
                  <t.icon className="h-3.5 w-3.5" /> + {t.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Data</label>
            <input type="date" className={inputCls + " w-44"} value={it.data} onChange={(e) => update(i, { data: e.target.value })} />
          </div>
        </div>
      ))}

      <button type="button" onClick={addItem} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm text-white/50 transition hover:border-accent/40 hover:text-accent">
        <Plus className="h-4 w-4" /> Adicionar item ao acervo
      </button>

      <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0e14]/90 p-3 backdrop-blur">
        <button type="button" onClick={handleSave} disabled={isPending} className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50">
          <Save className="h-4 w-4" /> {isPending ? "Salvando..." : saveLabel}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
