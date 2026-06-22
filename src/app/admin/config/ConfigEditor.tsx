"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";
import type { SiteConfig } from "@/lib/content";
import { saveSiteConfig } from "@/app/admin/actions";

type Props = {
  initialConfig: SiteConfig;
};

export default function ConfigEditor({ initialConfig }: Props) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(field: "footerName" | "footerTagline", value: string) {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function updateMarqueeItem(index: number, value: string) {
    setConfig((prev) => {
      const marqueeItems = [...prev.marqueeItems];
      marqueeItems[index] = value;
      return { ...prev, marqueeItems };
    });
    setSaved(false);
  }

  function removeMarqueeItem(index: number) {
    setConfig((prev) => ({
      ...prev,
      marqueeItems: prev.marqueeItems.filter((_, i) => i !== index),
    }));
    setSaved(false);
  }

  function addMarqueeItem() {
    setConfig((prev) => ({
      ...prev,
      marqueeItems: [...prev.marqueeItems, ""],
    }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveSiteConfig(config);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-[0.1em]">Barra de marquee</h2>
        <div className="space-y-2">
          {config.marqueeItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateMarqueeItem(index, e.target.value)}
                className="flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
              />
              <button
                type="button"
                onClick={() => removeMarqueeItem(index)}
                className="text-white/30 hover:text-red-400 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addMarqueeItem}
            className="flex items-center gap-1 text-xs text-white/40 hover:text-accent transition"
          >
            <Plus className="h-3 w-3" /> Adicionar item
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-[0.1em]">Rodapé</h2>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Nome / Descrição (esquerda)</label>
          <input
            type="text"
            value={config.footerName}
            onChange={(e) => updateField("footerName", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Copyright (direita)</label>
          <input
            type="text"
            value={config.footerTagline}
            onChange={(e) => updateField("footerTagline", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
