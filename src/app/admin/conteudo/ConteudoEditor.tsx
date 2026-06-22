"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import type { ContentItemData } from "@/lib/content";
import { saveContentItems } from "@/app/admin/actions";

type Props = {
  initialItems: ContentItemData[];
};

export default function ConteudoEditor({ initialItems }: Props) {
  const [items, setItems] = useState<ContentItemData[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(index: number, field: keyof ContentItemData, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    setSaved(false);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function addItem() {
    setItems((prev) => [...prev, { title: "", subtitle: "", link: "" }]);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveContentItems(items);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.12em] text-white/40">Item {index + 1}</span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Título</label>
            <input
              type="text"
              value={item.title}
              onChange={(e) => update(index, "title", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Subtítulo</label>
            <input
              type="text"
              value={item.subtitle}
              onChange={(e) => update(index, "subtitle", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Link (URL)</label>
            <input
              type="url"
              value={item.link}
              onChange={(e) => update(index, "link", e.target.value)}
              placeholder="https://"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
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
          {isPending ? "Salvando..." : "Salvar conteúdo"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
