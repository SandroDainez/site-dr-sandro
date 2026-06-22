"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import type { WhyUsData } from "@/lib/content";
import { saveWhyUs } from "@/app/admin/actions";

const ICON_OPTIONS = [
  "Layers", "CalendarClock", "FileText", "Zap", "HeartPulse", "BookOpen", "AudioLines",
  "BrainCircuit", "Microscope", "ShieldCheck", "Sparkles", "GraduationCap",
];

type Props = {
  initialCards: WhyUsData[];
};

export default function PorQueNosEditor({ initialCards }: Props) {
  const [cards, setCards] = useState<WhyUsData[]>(initialCards);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(index: number, field: keyof WhyUsData, value: string) {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
    setSaved(false);
  }

  function removeCard(index: number) {
    setCards((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function addCard() {
    setCards((prev) => [...prev, { icon: "ShieldCheck", title: "", text: "" }]);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveWhyUs(cards);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {cards.map((card, index) => (
        <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.12em] text-white/40">Card {index + 1}</span>
            <button
              type="button"
              onClick={() => removeCard(index)}
              className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Ícone</label>
            <select
              value={card.icon}
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
              value={card.title}
              onChange={(e) => update(index, "title", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Texto</label>
            <textarea
              rows={2}
              value={card.text}
              onChange={(e) => update(index, "text", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50 resize-none"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addCard}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm text-white/50 transition hover:border-accent/40 hover:text-accent"
      >
        <Plus className="h-4 w-4" /> Adicionar card
      </button>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar cards"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
