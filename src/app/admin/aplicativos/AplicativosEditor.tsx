"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, X, Upload, Loader2 } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { AplicativoData } from "@/lib/content";
import { saveAplicativos } from "@/app/admin/actions";
import RichTextEditor from "@/components/admin/RichTextEditor";
import AreasExtra from "@/components/admin/AreasExtra";

const GLOW_OPTIONS = [
  { label: "Verde (Emerald)", value: "from-emerald-400/30 to-emerald-600/5" },
  { label: "Azul", value: "from-blue-400/30 to-blue-600/5" },
  { label: "Violeta", value: "from-violet-400/30 to-violet-600/5" },
  { label: "Ciano", value: "from-cyan-400/30 to-cyan-600/5" },
  { label: "Âmbar", value: "from-amber-400/30 to-amber-600/5" },
  { label: "Rosa", value: "from-pink-400/30 to-pink-600/5" },
];

const inputCls = "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-muted";

export default function AplicativosEditor({ initial }: { initial: AplicativoData[] }) {
  const [apps, setApps] = useState<AplicativoData[]>(initial);
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  function upd<K extends keyof AplicativoData>(i: number, field: K, value: AplicativoData[K]) {
    setApps((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));
    setSaved(false);
  }

  async function handleLogo(i: number, file: File) {
    setError(null); setUploadingIdx(i);
    try {
      const blob = await upload(`apps/${Date.now()}-${file.name}`, file, { access: "private", handleUploadUrl: "/api/upload" });
      upd(i, "imageUrl", `/api/img?url=${encodeURIComponent(blob.url)}`);
    } catch (e) {
      setError("Falha no upload do logo: " + String(e instanceof Error ? e.message : e));
    } finally { setUploadingIdx(null); }
  }

  function updHighlight(ai: number, hi: number, v: string) {
    setApps((prev) => prev.map((a, i) => i === ai ? { ...a, highlights: (a.highlights ?? []).map((h, j) => j === hi ? v : h) } : a));
    setSaved(false);
  }
  function addHighlight(ai: number) { setApps((prev) => prev.map((a, i) => i === ai ? { ...a, highlights: [...(a.highlights ?? []), ""] } : a)); }
  function removeHighlight(ai: number, hi: number) { setApps((prev) => prev.map((a, i) => i === ai ? { ...a, highlights: (a.highlights ?? []).filter((_, j) => j !== hi) } : a)); setSaved(false); }

  function removeApp(i: number) { setApps((prev) => prev.filter((_, idx) => idx !== i)); setSaved(false); }
  function addApp() {
    setApps((prev) => [...prev, {
      id: `novo-${prev.length + 1}`, title: "", subtitle: "", text: "", icon: "Layers",
      glow: GLOW_OPTIONS[0].value, highlights: [""], link: "", acesso: "gratis", finalidade: "decisao", area: "geral", areas: [],
    }]);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    // garante id único e não-vazio
    const limpos = apps.map((a, i) => ({ ...a, id: a.id?.trim() || `app-${i + 1}` }));
    start(async () => {
      const r = await saveAplicativos(limpos);
      if (r.ok) { setSaved(true); setApps(limpos); } else setError(r.error);
    });
  }

  return (
    <div className="space-y-4">
      {apps.map((app, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.12em] text-white/40">App {i + 1}{app.title ? ` — ${app.title}` : ""}</span>
            <button type="button" onClick={() => removeApp(i)} className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20">
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          </div>

          {/* Acesso + Finalidade — os dois botões que resolvem tudo */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Acesso</label>
              <select className={inputCls} value={app.acesso} onChange={(e) => upd(i, "acesso", e.target.value as AplicativoData["acesso"])}>
                <option value="gratis">Grátis</option>
                <option value="assinatura">Assinatura</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Finalidade (grupo na home)</label>
              <select className={inputCls} value={app.finalidade} onChange={(e) => upd(i, "finalidade", e.target.value as AplicativoData["finalidade"])}>
                <option value="decisao">Decisão clínica</option>
                <option value="estudo">Estudo e preparação</option>
                <option value="gestao">Gestão e equipes</option>
                <option value="utilidade">Utilidades</option>
              </select>
            </div>
          </div>

          {app.finalidade === "utilidade" && (
            <div>
              <label className={labelCls}>Rótulo (só utilidades — ex.: Finanças, Organização)</label>
              <input className={inputCls} value={app.rotulo ?? ""} onChange={(e) => upd(i, "rotulo", e.target.value)} placeholder="Finanças, Organização, Produtividade…" />
            </div>
          )}

          {/* Logo */}
          <div>
            <label className={labelCls}>Logo do app (opcional)</label>
            <div className="flex items-center gap-3">
              {app.imageUrl ? (
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={app.imageUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 text-[10px] text-white/30">sem img</div>
              )}
              <input type="file" accept="image/*" id={`logo-${i}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogo(i, f); e.target.value = ""; }} />
              <label htmlFor={`logo-${i}`} className={`flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white transition hover:bg-white/[0.10] ${uploadingIdx === i ? "opacity-50 pointer-events-none" : ""}`}>
                {uploadingIdx === i ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando…</> : <><Upload className="h-3.5 w-3.5" /> Enviar logo</>}
              </label>
              {app.imageUrl && <button type="button" onClick={() => upd(i, "imageUrl", "")} className="text-xs text-white/40 transition hover:text-red-400">Remover</button>}
            </div>
            {app.imageUrl && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs text-muted">Tamanho do logo</label>
                  <span className="text-xs font-semibold tabular-nums text-accent">{app.imageSize ?? 48}px</span>
                </div>
                <input type="range" min={24} max={120} value={app.imageSize ?? 48} onChange={(e) => upd(i, "imageSize", Number(e.target.value))} className="w-full accent-[var(--accent,#2ce6b8)]" />
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Título</label>
            <input className={inputCls} value={app.title} onChange={(e) => upd(i, "title", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Subtítulo (opcional)</label>
            <RichTextEditor value={app.subtitle ?? ""} onChange={(html) => upd(i, "subtitle", html)} />
          </div>
          <div>
            <label className={labelCls}>Descrição</label>
            <RichTextEditor value={app.text} onChange={(html) => upd(i, "text", html)} />
          </div>

          <div>
            <label className={labelCls}>Área no site</label>
            <select className={inputCls} value={app.area ?? "geral"} onChange={(e) => upd(i, "area", e.target.value as NonNullable<AplicativoData["area"]>)}>
              <option value="geral">Geral</option>
              <option value="emergencias">Emergências</option>
              <option value="ti">Terapia Intensiva</option>
              <option value="anestesiologia">Anestesiologia</option>
            </select>
          </div>
          <AreasExtra value={app.areas ?? []} primary={app.area ?? "geral"} onChange={(areas) => upd(i, "areas", areas as AplicativoData["areas"])} />

          <div>
            <label className={labelCls}>Link do app (URL)</label>
            <input type="url" className={inputCls} value={app.link ?? ""} onChange={(e) => upd(i, "link", e.target.value)} placeholder="https://" />
          </div>

          {app.acesso === "assinatura" && (
            <div>
              <label className={labelCls}>Destaques (só assinatura)</label>
              <div className="space-y-2">
                {(app.highlights ?? []).map((hl, hi) => (
                  <div key={hi} className="flex items-center gap-2">
                    <input className={`${inputCls} flex-1`} value={hl} onChange={(e) => updHighlight(i, hi, e.target.value)} />
                    <button type="button" onClick={() => removeHighlight(i, hi)} className="text-white/30 hover:text-red-400 transition"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addHighlight(i)} className="flex items-center gap-1 text-xs text-white/40 hover:text-accent transition"><Plus className="h-3 w-3" /> Adicionar destaque</button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button type="button" onClick={addApp} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm text-white/50 transition hover:border-accent/40 hover:text-accent">
        <Plus className="h-4 w-4" /> Adicionar app
      </button>

      <div className="flex items-center gap-3 pt-2">
        <button type="button" onClick={handleSave} disabled={isPending} className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
          <Save className="h-4 w-4" /> {isPending ? "Salvando…" : "Salvar aplicativos"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
