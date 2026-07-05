"use client";

import { useState, useTransition } from "react";
import { Type, Save, Minus, Plus, RotateCcw } from "lucide-react";
import {
  FONT_OPTIONS,
  WEIGHT_OPTIONS,
  normalizeStyle,
  type SectionStyle,
} from "@/lib/typography-sections";
import { saveTypographySection } from "@/app/admin/actions";

type Props = {
  sectionKey: string;
  label?: string;
  initial?: SectionStyle | number;
};

const SIZE_MIN = 50;
const SIZE_MAX = 160;

function clampSize(v: number) {
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, v));
}

function fontStackOf(key: string | undefined): string {
  const f = FONT_OPTIONS.find((o) => o.key === (key ?? ""));
  return f ? f.stack : FONT_OPTIONS[0].stack;
}

export default function AreaTypography({ sectionKey, label, initial }: Props) {
  const [style, setStyle] = useState<SectionStyle>(normalizeStyle(initial));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizePct = Math.round((style.scale ?? 1) * 100);

  function patch(p: Partial<SectionStyle>) {
    setStyle((prev) => ({ ...prev, ...p }));
    setSaved(false);
  }

  function setSize(pct: number) {
    patch({ scale: clampSize(pct) / 100 });
  }

  function resetAll() {
    setStyle({});
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    // Limpa campos "padrão" para não gravar lixo
    const clean: SectionStyle = {};
    if (style.scale && style.scale !== 1) clean.scale = style.scale;
    if (style.font) clean.font = style.font;
    if (style.color) clean.color = style.color;
    if (style.weight) clean.weight = style.weight;

    startTransition(async () => {
      const res = await saveTypographySection(sectionKey, clean);
      if (res.ok) {
        setSaved(true);
        setStyle(clean);
      } else {
        setError(res.error);
      }
    });
  }

  const previewStyle: React.CSSProperties = {
    fontFamily: fontStackOf(style.font),
    color: style.color || undefined,
    fontWeight: style.weight || undefined,
    fontSize: `${(style.scale ?? 1) * 1.05}rem`,
  };

  return (
    <div className="mt-8 rounded-2xl border border-accent/20 bg-accent/[0.04] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Type className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-white">
          Aparência do texto{label ? ` — ${label}` : ""}
        </h3>
      </div>
      <p className="mb-4 text-xs text-muted">
        Ajuste tamanho, fonte, cor e peso das letras desta seção do site. O que ficar em
        &quot;Padrão&quot; mantém o estilo original.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Tamanho */}
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-muted">Tamanho</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSize(sizePct - 5)}
              disabled={sizePct <= SIZE_MIN}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/30 text-white transition hover:bg-white/10 disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-14 text-center text-sm font-semibold tabular-nums text-accent">{sizePct}%</span>
            <button
              type="button"
              onClick={() => setSize(sizePct + 5)}
              disabled={sizePct >= SIZE_MAX}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/30 text-white transition hover:bg-white/10 disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => patch({ scale: undefined })}
              className="ml-1 text-xs text-white/50 underline underline-offset-2 hover:text-white"
            >
              Padrão
            </button>
          </div>
        </div>

        {/* Fonte */}
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-muted">Tipo de fonte</label>
          <select
            value={style.font ?? ""}
            onChange={(e) => patch({ font: e.target.value || undefined })}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.key || "default"} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cor */}
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-muted">Cor das letras</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.color || "#ffffff"}
              onChange={(e) => patch({ color: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded-lg border border-white/15 bg-black/30"
            />
            <span className="text-xs text-white/60 tabular-nums">{style.color || "padrão"}</span>
            <button
              type="button"
              onClick={() => patch({ color: undefined })}
              className="ml-auto text-xs text-white/50 underline underline-offset-2 hover:text-white"
            >
              Padrão
            </button>
          </div>
        </div>

        {/* Peso */}
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-muted">Peso / estilo</label>
          <select
            value={style.weight ?? ""}
            onChange={(e) => patch({ weight: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
          >
            <option value="">Padrão</option>
            {WEIGHT_OPTIONS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prévia */}
      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
        <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-white/30">Prévia</p>
        <p style={previewStyle}>Texto de exemplo desta seção — 123</p>
      </div>

      {/* Ações */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar aparência"}
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Tudo padrão
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
