"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import type { HeroData } from "@/lib/content";
import { saveHero } from "@/app/admin/actions";

type Props = {
  initialHero: HeroData;
};

export default function HeroEditor({ initialHero }: Props) {
  const [hero, setHero] = useState<HeroData>(initialHero);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof HeroData, value: string) {
    setHero((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveHero(hero);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            Badge (texto pequeno acima do título)
          </label>
          <input
            type="text"
            value={hero.badge}
            onChange={(e) => update("badge", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-amber-400/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            Título principal
          </label>
          <textarea
            rows={2}
            value={hero.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-amber-400/50 resize-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            Subtítulo
          </label>
          <textarea
            rows={3}
            value={hero.subtitle}
            onChange={(e) => update("subtitle", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-amber-400/50 resize-none"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.1em] text-muted">Preview</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-accent">{hero.badge}</p>
          <p className="mt-1 text-lg font-medium text-white leading-tight">{hero.title}</p>
          <p className="mt-1 text-xs text-muted leading-relaxed">{hero.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar hero"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
