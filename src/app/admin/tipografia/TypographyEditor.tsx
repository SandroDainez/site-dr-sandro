"use client";

import { useState, useTransition } from "react";
import { Save, RotateCcw, Minus, Plus, Type } from "lucide-react";
import { TYPOGRAPHY_SECTIONS, type TypographyData } from "@/lib/typography-sections";
import { saveTypography } from "@/app/admin/actions";

type Props = {
  initialTypography: TypographyData;
};

// Escalas disponíveis (em % do tamanho normal).
const STEPS = [80, 90, 100, 110, 125, 140] as const;
const MIN = 80;
const MAX = 140;

function clamp(v: number) {
  return Math.min(MAX, Math.max(MIN, v));
}

function pct(scale: number | undefined): number {
  // Sem valor salvo = 100% (normal).
  return Math.round((scale ?? 1) * 100);
}

export default function TypographyEditor({ initialTypography }: Props) {
  const [typo, setTypo] = useState<TypographyData>(initialTypography);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setValue(key: string, percent: number) {
    const p = clamp(percent);
    setTypo((prev) => ({ ...prev, [key]: p / 100 }));
    setSaved(false);
  }

  function reset(key: string) {
    setTypo((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveTypography(typo);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-accent/20 bg-accent/[0.04] p-4 text-sm text-white/70">
        <p>
          Ajuste o tamanho das letras de cada seção do site. <strong className="text-white">100%</strong> é o tamanho
          padrão. Use os botões <span className="text-white">−</span> / <span className="text-white">+</span> para
          ajuste fino, ou clique em um valor rápido. Depois clique em <strong className="text-white">Salvar</strong>.
        </p>
      </div>

      <div className="space-y-3">
        {TYPOGRAPHY_SECTIONS.map((section) => {
          const value = pct(typo[section.key]);
          const isDefault = typo[section.key] === undefined;
          return (
            <div
              key={section.key}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-white">{section.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Ajuste fino */}
                  <button
                    type="button"
                    onClick={() => setValue(section.key, value - 5)}
                    disabled={value <= MIN}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/30 text-white transition hover:bg-white/10 disabled:opacity-30"
                    aria-label="Diminuir"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span
                    className={`w-14 text-center text-sm font-semibold tabular-nums ${
                      isDefault ? "text-white/50" : "text-accent"
                    }`}
                  >
                    {value}%
                  </span>

                  <button
                    type="button"
                    onClick={() => setValue(section.key, value + 5)}
                    disabled={value >= MAX}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/30 text-white transition hover:bg-white/10 disabled:opacity-30"
                    aria-label="Aumentar"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => reset(section.key)}
                    disabled={isDefault}
                    className="ml-1 flex h-8 items-center gap-1 rounded-lg border border-white/15 bg-black/30 px-2 text-xs text-white/70 transition hover:bg-white/10 disabled:opacity-30"
                    title="Voltar ao padrão (100%)"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Padrão
                  </button>
                </div>
              </div>

              {/* Valores rápidos */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {STEPS.map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setValue(section.key, step)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      value === step
                        ? "border-accent/50 bg-accent/15 text-accent"
                        : "border-white/15 bg-black/20 text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {step}%
                  </button>
                ))}
              </div>

              {/* Preview ao vivo */}
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-white/30">Prévia</p>
                <p
                  className="font-semibold text-white"
                  style={{ fontSize: `${value / 100}rem` }}
                >
                  Texto de exemplo desta seção
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-6 flex items-center gap-3 border-t border-white/10 bg-[#07090f]/90 px-6 py-4 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar tamanhos"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
