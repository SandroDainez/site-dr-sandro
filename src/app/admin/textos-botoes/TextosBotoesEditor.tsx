"use client";

import { useState, useTransition } from "react";
import { Save, RotateCcw } from "lucide-react";
import { UI_TEXTS, type UiTextsData } from "@/lib/ui-texts";
import { saveUiTexts } from "@/app/admin/actions";

const inputCls =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";

export default function TextosBotoesEditor({ initial }: { initial: UiTextsData }) {
  const [data, setData] = useState<UiTextsData>(initial || {});
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }
  function reset(key: string) {
    setData((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
    setSaved(false);
  }
  function handleSave() {
    setError(null);
    startTransition(async () => {
      const r = await saveUiTexts(data);
      if (r.ok) setSaved(true);
      else setError(r.error);
    });
  }

  const groups: string[] = [];
  for (const u of UI_TEXTS) if (!groups.includes(u.group)) groups.push(u.group);

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-white/40">{g}</p>
          <div className="space-y-3">
            {UI_TEXTS.filter((u) => u.group === g).map((u) => {
              const long = u.default.length > 60;
              const changed = data[u.key] !== undefined;
              return (
                <div key={u.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-xs uppercase tracking-[0.1em] text-white/50">{u.label}</label>
                    {changed && (
                      <button type="button" onClick={() => reset(u.key)} className="flex items-center gap-1 text-[11px] text-white/40 transition hover:text-white">
                        <RotateCcw className="h-3 w-3" /> Padrão
                      </button>
                    )}
                  </div>
                  {long ? (
                    <textarea className={inputCls + " min-h-[70px] resize-y"} value={data[u.key] ?? ""} placeholder={u.default} onChange={(e) => update(u.key, e.target.value)} />
                  ) : (
                    <input className={inputCls} value={data[u.key] ?? ""} placeholder={u.default} onChange={(e) => update(u.key, e.target.value)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0e14]/90 p-3 backdrop-blur">
        <button type="button" onClick={handleSave} disabled={isPending} className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar textos"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
