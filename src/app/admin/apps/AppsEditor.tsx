"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, X, Upload, Loader2 } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { AppData } from "@/lib/content";
import { saveApps } from "@/app/admin/actions";
import RichTextEditor from "@/components/admin/RichTextEditor";
import AreasExtra from "@/components/admin/AreasExtra";

const ICON_OPTIONS = [
  "Layers", "CalendarClock", "FileText", "Zap", "HeartPulse", "BookOpen", "AudioLines",
  "BrainCircuit", "Microscope", "ShieldCheck", "Sparkles", "GraduationCap",
];

const GLOW_OPTIONS = [
  { label: "Verde (Emerald)", value: "from-emerald-400/30 to-emerald-600/5" },
  { label: "Azul", value: "from-blue-400/30 to-blue-600/5" },
  { label: "Violeta", value: "from-violet-400/30 to-violet-600/5" },
  { label: "Ciano", value: "from-cyan-400/30 to-cyan-600/5" },
  { label: "Âmbar", value: "from-amber-400/30 to-amber-600/5" },
  { label: "Rosa", value: "from-pink-400/30 to-pink-600/5" },
];

type Props = {
  initialApps: AppData[];
};

export default function AppsEditor({ initialApps }: Props) {
  const [apps, setApps] = useState<AppData[]>(initialApps);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  async function handleThumbUpload(index: number, file: File) {
    setError(null);
    setUploadingIdx(index);
    try {
      const blob = await upload(`apps/${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      });
      const proxyUrl = `/api/img?url=${encodeURIComponent(blob.url)}`;
      updateApp(index, "thumbnailUrl", proxyUrl);
    } catch (e) {
      setError("Falha no upload da miniatura: " + String(e instanceof Error ? e.message : e));
    } finally {
      setUploadingIdx(null);
    }
  }

  function updateApp(index: number, field: keyof AppData, value: string | string[]) {
    setApps((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
    setSaved(false);
  }

  function updateHighlight(appIndex: number, hlIndex: number, value: string) {
    setApps((prev) =>
      prev.map((a, i) => {
        if (i !== appIndex) return a;
        const highlights = [...a.highlights];
        highlights[hlIndex] = value;
        return { ...a, highlights };
      })
    );
    setSaved(false);
  }

  function addHighlight(appIndex: number) {
    setApps((prev) =>
      prev.map((a, i) =>
        i === appIndex ? { ...a, highlights: [...a.highlights, ""] } : a
      )
    );
  }

  function removeHighlight(appIndex: number, hlIndex: number) {
    setApps((prev) =>
      prev.map((a, i) => {
        if (i !== appIndex) return a;
        return { ...a, highlights: a.highlights.filter((_, j) => j !== hlIndex) };
      })
    );
    setSaved(false);
  }

  function removeApp(index: number) {
    setApps((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function addApp() {
    setApps((prev) => [
      ...prev,
      { title: "", subtitle: "", text: "", icon: "Layers", glow: GLOW_OPTIONS[0].value, highlights: [""], link: "", area: "geral", areas: [] },
    ]);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveApps(apps);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {apps.map((app, index) => (
        <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.12em] text-white/40">App {index + 1}</span>
            <button
              type="button"
              onClick={() => removeApp(index)}
              className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Ícone</label>
              <select
                value={app.icon}
                onChange={(e) => updateApp(index, "icon", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Cor de destaque</label>
              <select
                value={app.glow}
                onChange={(e) => updateApp(index, "glow", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
              >
                {GLOW_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              Miniatura do app (opcional — aparece no canto do card)
            </label>
            <div className="flex items-center gap-3">
              {app.thumbnailUrl ? (
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={app.thumbnailUrl} alt="Miniatura" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 text-[10px] text-white/30">
                  sem img
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  id={`thumb-${index}`}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleThumbUpload(index, f);
                    e.target.value = "";
                  }}
                />
                <label
                  htmlFor={`thumb-${index}`}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white transition hover:bg-white/[0.10] ${uploadingIdx === index ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {uploadingIdx === index ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>
                  ) : (
                    <><Upload className="h-3.5 w-3.5" /> Enviar miniatura</>
                  )}
                </label>
                {app.thumbnailUrl && (
                  <button
                    type="button"
                    onClick={() => updateApp(index, "thumbnailUrl", "")}
                    className="text-xs text-white/40 transition hover:text-red-400"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            {/* Tamanho da miniatura/logo — só quando há imagem */}
            {app.thumbnailUrl && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs text-muted">Tamanho da miniatura</label>
                  <span className="text-xs font-semibold tabular-nums text-accent">{app.thumbnailSize ?? 48}px</span>
                </div>
                <input
                  type="range"
                  min={24}
                  max={120}
                  value={app.thumbnailSize ?? 48}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setApps((prev) => prev.map((a, i) => (i === index ? { ...a, thumbnailSize: v } : a)));
                    setSaved(false);
                  }}
                  className="w-full accent-[var(--accent,#2ce6b8)]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Título</label>
            <input
              type="text"
              value={app.title}
              onChange={(e) => updateApp(index, "title", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Subtítulo</label>
            <RichTextEditor value={app.subtitle} onChange={(html) => updateApp(index, "subtitle", html)} />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Descrição</label>
            <RichTextEditor value={app.text} onChange={(html) => updateApp(index, "text", html)} />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Área no site</label>
            <select
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
              value={app.area ?? "geral"}
              onChange={(e) => updateApp(index, "area", e.target.value)}
            >
              <option value="geral">Geral</option>
              <option value="emergencias">Emergências</option>
              <option value="ti">Terapia Intensiva</option>
              <option value="anestesiologia">Anestesiologia</option>
            </select>
          </div>
          <AreasExtra value={app.areas ?? []} primary={app.area ?? "geral"} onChange={(areas) => updateApp(index, "areas", areas)} />

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Link do app (URL — ex: https://anesmap.app)</label>
            <input
              type="url"
              value={app.link ?? ""}
              onChange={(e) => updateApp(index, "link", e.target.value)}
              placeholder="https://"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.1em] text-muted">Destaques</label>
            <div className="space-y-2">
              {app.highlights.map((hl, hlIndex) => (
                <div key={hlIndex} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={hl}
                    onChange={(e) => updateHighlight(index, hlIndex, e.target.value)}
                    className="flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
                  />
                  <button
                    type="button"
                    onClick={() => removeHighlight(index, hlIndex)}
                    className="text-white/30 hover:text-red-400 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addHighlight(index)}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-accent transition"
              >
                <Plus className="h-3 w-3" /> Adicionar destaque
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addApp}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm text-white/50 transition hover:border-accent/40 hover:text-accent"
      >
        <Plus className="h-4 w-4" /> Adicionar app
      </button>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar apps"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
