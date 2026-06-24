"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, Upload, Loader2, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { FreeAppData } from "@/lib/content";
import { saveFreeApps } from "@/app/admin/actions";
import RichTextEditor from "@/components/admin/RichTextEditor";

const ICON_OPTIONS = [
  "Layers", "CalendarClock", "FileText", "Zap", "HeartPulse", "BookOpen", "AudioLines",
  "BrainCircuit", "Microscope", "ShieldCheck", "Sparkles", "GraduationCap",
];

type Props = {
  initialApps: FreeAppData[];
};

export default function AppsGratisEditor({ initialApps }: Props) {
  const [apps, setApps] = useState<FreeAppData[]>(initialApps);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  function update(index: number, field: keyof FreeAppData, value: string) {
    setApps((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
    setSaved(false);
  }

  async function handleImageUpload(index: number, file: File) {
    setError(null);
    setUploadingIndex(index);
    try {
      const blob = await upload(`apps-gratis/${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      });
      update(index, "imageUrl", `/api/img?url=${encodeURIComponent(blob.url)}`);
    } catch (e) {
      setError("Falha no upload: " + String(e instanceof Error ? e.message : e));
    } finally {
      setUploadingIndex(null);
    }
  }

  function removeApp(index: number) {
    setApps((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function addApp() {
    setApps((prev) => [
      ...prev,
      { title: "", desc: "", icon: "BookOpen", link: "" },
    ]);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveFreeApps(apps);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {apps.map((app, index) => (
        <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.12em] text-white/40">Item {index + 1}</span>
            <button
              type="button"
              onClick={() => removeApp(index)}
              className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          </div>

          {/* Imagem própria (logo do app) — substitui o ícone quando definida */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Imagem / logo do app</label>
            <div className="flex items-center gap-3">
              {app.imageUrl ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={app.imageUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => update(index, "imageUrl", "")}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                    title="Remover imagem"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/20 text-white/30 text-[10px]">
                  ícone
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                id={`free-img-${index}`}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(index, f);
                  e.target.value = "";
                }}
              />
              <label
                htmlFor={`free-img-${index}`}
                className={`flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-3 py-1.5 text-xs text-white transition hover:bg-white/10 ${uploadingIndex === index ? "pointer-events-none opacity-50" : ""}`}
              >
                {uploadingIndex === index ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="h-3.5 w-3.5" /> Enviar imagem</>
                )}
              </label>
            </div>

            {/* Tamanho do logo — só quando há imagem */}
            {app.imageUrl && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs text-muted">Tamanho do logo</label>
                  <span className="text-xs font-semibold tabular-nums text-accent">{app.imageSize ?? 28}px</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={96}
                  value={app.imageSize ?? 28}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setApps((prev) => prev.map((a, i) => (i === index ? { ...a, imageSize: v } : a)));
                    setSaved(false);
                  }}
                  className="w-full accent-[var(--accent,#2ce6b8)]"
                />
              </div>
            )}
          </div>

          {/* Ícone (usado quando não há imagem) */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Ícone (se não tiver imagem)</label>
            <select
              value={app.icon}
              onChange={(e) => update(index, "icon", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Título</label>
            <input
              type="text"
              value={app.title}
              onChange={(e) => update(index, "title", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Descrição</label>
            <RichTextEditor value={app.desc} onChange={(html) => update(index, "desc", html)} />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Link (URL)</label>
            <input
              type="url"
              value={app.link}
              onChange={(e) => update(index, "link", e.target.value)}
              placeholder="https://"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addApp}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm text-white/50 transition hover:border-accent/40 hover:text-accent"
      >
        <Plus className="h-4 w-4" /> Adicionar item
      </button>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar apps grátis"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
