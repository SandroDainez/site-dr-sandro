"use client";

import { useState, useTransition } from "react";
import { Save, RotateCcw } from "lucide-react";
import { SECTION_TEXTS, type SectionTextsData } from "@/lib/section-texts";
import { saveSectionTexts } from "@/app/admin/actions";

const inputCls =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";

export default function TitulosEditor({ initial }: { initial: SectionTextsData }) {
  const [data, setData] = useState<SectionTextsData>(initial || {});
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, field: "eyebrow" | "title" | "desc", value: string) {
    setData((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    setSaved(false);
  }

  function reset(key: string) {
    setData((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const r = await saveSectionTexts(data);
      if (r.ok) setSaved(true);
      else setError(r.error);
    });
  }

  // agrupa por "group"
  const groups: string[] = [];
  for (const s of SECTION_TEXTS) if (!groups.includes(s.group)) groups.push(s.group);

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-white/40">{g}</p>
          <div className="space-y-4">
            {SECTION_TEXTS.filter((s) => s.group === g).map((s) => {
              const cur = data[s.key] || {};
              const changed = !!(cur.eyebrow || cur.title || cur.desc);
              return (
                <div key={s.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent">{s.label}</span>
                    {changed && (
                      <button
                        type="button"
                        onClick={() => reset(s.key)}
                        className="flex items-center gap-1 text-[11px] text-white/40 transition hover:text-white"
                        title="Voltar ao texto padrão"
                      >
                        <RotateCcw className="h-3 w-3" /> Padrão
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">Rótulo pequeno</label>
                      <input className={inputCls} value={cur.eyebrow ?? ""} placeholder={s.eyebrow} onChange={(e) => update(s.key, "eyebrow", e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">Título grande</label>
                      <input className={inputCls} value={cur.title ?? ""} placeholder={s.title} onChange={(e) => update(s.key, "title", e.target.value)} />
                    </div>
                  </div>
                  {s.desc !== undefined && (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                        {s.key === "apps" ? "Aviso (apoio à decisão clínica)" : "Descrição / subtítulo"}
                      </label>
                      <textarea
                        className={inputCls + " min-h-[64px] resize-y"}
                        value={cur.desc ?? ""}
                        placeholder={s.desc}
                        onChange={(e) => update(s.key, "desc", e.target.value)}
                      />
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-white/35">Deixe em branco para usar o padrão.</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0e14]/90 p-3 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar títulos"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
