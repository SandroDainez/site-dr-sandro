"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";
import type { AppData } from "@/lib/content";
import { saveApps } from "@/app/admin/actions";

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
      { title: "", subtitle: "", text: "", icon: "Layers", glow: GLOW_OPTIONS[0].value, highlights: [""] },
    ]);
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveApps(apps);
      setSaved(true);
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
            <input
              type="text"
              value={app.subtitle}
              onChange={(e) => updateApp(index, "subtitle", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Descrição</label>
            <textarea
              rows={2}
              value={app.text}
              onChange={(e) => updateApp(index, "text", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50 resize-none"
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
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar apps"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
      </div>
    </div>
  );
}
