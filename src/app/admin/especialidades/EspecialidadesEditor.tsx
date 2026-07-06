"use client";

import { useState, useTransition } from "react";
import { Save, Upload, Loader2, Trash2, Plus, ArrowUp, ArrowDown, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { EspecialidadeCardData } from "@/lib/content";
import { CORES_LISTA, corTema } from "@/lib/especialidade-cor";
import { saveEspecialidades } from "@/app/admin/actions";

const AREAS = [
  { value: "", label: "Nenhuma (card avulso)" },
  { value: "emergencias", label: "Emergências" },
  { value: "ti", label: "Terapia Intensiva" },
  { value: "anestesiologia", label: "Anestesiologia" },
];

function novoId() {
  // id estável sem depender de Date.now()/random no render (só no clique)
  return "esp-" + Math.random().toString(36).slice(2, 9);
}

export default function EspecialidadesEditor({ initial }: { initial: EspecialidadeCardData[] }) {
  const [items, setItems] = useState<EspecialidadeCardData[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  function touch() { setSaved(false); }
  function update(i: number, field: keyof EspecialidadeCardData, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
    touch();
  }
  function add() {
    setItems((prev) => [...prev, { id: novoId(), label: "Nova especialidade", desc: "", emoji: "🩺", href: "/", cor: "accent", area: "" }]);
    touch();
  }
  function remove(i: number) { setItems((prev) => prev.filter((_, idx) => idx !== i)); touch(); }
  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    touch();
  }
  async function uploadLogo(i: number, file: File) {
    setError(null);
    setUploadingIdx(i);
    try {
      const blob = await upload(`especialidades/logo-${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      });
      update(i, "logoUrl", `/api/img?url=${encodeURIComponent(blob.url)}`);
    } catch (e) {
      setError("Falha no upload do logo: " + String(e instanceof Error ? e.message : e));
    } finally {
      setUploadingIdx(null);
    }
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveEspecialidades(items);
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-5">
      {items.map((it, i) => {
        const tema = corTema(it.cor);
        return (
          <div key={it.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/40">Card {i + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg border border-white/10 p-1.5 text-white/60 transition hover:text-white disabled:opacity-30" aria-label="Subir"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded-lg border border-white/10 p-1.5 text-white/60 transition hover:text-white disabled:opacity-30" aria-label="Descer"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => remove(i)} className="rounded-lg border border-rose-400/20 p-1.5 text-rose-400/80 transition hover:bg-rose-400/10 hover:text-rose-400" aria-label="Remover"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex gap-4">
              {/* Preview do logo/emoji */}
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${tema.grad} to-transparent`}>
                {it.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.logoUrl} alt="" className="h-full w-full object-contain p-2" />
                ) : (
                  <span className="text-4xl">{it.emoji || "🩺"}</span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input type="file" accept="image/*" id={`logo-${it.id}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(i, f); e.target.value = ""; }} />
                  <label htmlFor={`logo-${it.id}`} className={`flex w-fit cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.10] ${uploadingIdx === i ? "pointer-events-none opacity-50" : ""}`}>
                    {uploadingIdx === i ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>) : (<><Upload className="h-3.5 w-3.5" /> {it.logoUrl ? "Trocar logo" : "Enviar logo"}</>)}
                  </label>
                  {it.logoUrl && (
                    <button type="button" onClick={() => update(i, "logoUrl", "")} className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:text-white/80"><X className="h-3 w-3" /> Remover logo</button>
                  )}
                  <span className="text-[11px] text-white/35">PNG/SVG. Sem logo, usa o emoji.</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-[80px_1fr]">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-white/40">Emoji</span>
                    <input value={it.emoji} onChange={(e) => update(i, "emoji", e.target.value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-lg text-white outline-none focus:border-accent/50" maxLength={4} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-white/40">Nome da especialidade</span>
                    <input value={it.label} onChange={(e) => update(i, "label", e.target.value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-accent/50" />
                  </label>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-white/40">Descrição curta</span>
                  <input value={it.desc} onChange={(e) => update(i, "desc", e.target.value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-accent/50" placeholder="Ex.: Urgência e emergência" />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-white/40">Destino do card (para onde leva o clique)</span>
                  <input value={it.href} onChange={(e) => update(i, "href", e.target.value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-white outline-none focus:border-accent/50" placeholder="/especialidade/emergencias ou https://..." />
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-white/40">Cor do tema</span>
                    <select value={it.cor} onChange={(e) => update(i, "cor", e.target.value)} className="rounded-lg border border-white/10 bg-[#151b26] px-3 py-2 text-sm text-white outline-none focus:border-accent/50">
                      {CORES_LISTA.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-white/40">Área das Atualizações (usa o logo nos boletins)</span>
                    <select value={it.area ?? ""} onChange={(e) => update(i, "area", e.target.value)} className="rounded-lg border border-white/10 bg-[#151b26] px-3 py-2 text-sm text-white outline-none focus:border-accent/50">
                      {AREAS.map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <button type="button" onClick={add} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] py-4 text-sm font-medium text-white/60 transition hover:border-accent/40 hover:text-white">
        <Plus className="h-4 w-4" /> Adicionar especialidade
      </button>

      {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>}

      <div className="sticky bottom-4 flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent shadow-lg transition hover:brightness-110 disabled:opacity-60">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        {saved && <span className="text-sm font-medium text-accent">✓ Salvo</span>}
      </div>
    </div>
  );
}
