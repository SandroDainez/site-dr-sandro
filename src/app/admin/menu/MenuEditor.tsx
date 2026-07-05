"use client";

import { useState, useTransition } from "react";
import { Save, Type } from "lucide-react";
import type { NavStyleData } from "@/lib/content";
import { saveNavStyle } from "@/app/admin/actions";

type Props = { initialStyle?: NavStyleData };

// linha de slider (fora do componente p/ não recriar no render)
function StyleRow({
  label, value, fallback, min, max, step = 1, suffix = "px", onChange,
}: {
  label: string; value: number | undefined; fallback: number; min: number; max: number;
  step?: number; suffix?: string; onChange: (v: number) => void;
}) {
  const v = value ?? fallback;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs text-white/60">{label}</label>
        <span className="text-xs font-semibold tabular-nums text-accent">
          {suffix === "%" ? Math.round(v * 100) : v}{suffix}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent,#2ce6b8)]"
      />
    </div>
  );
}

// Ajuste do TAMANHO da barra de menu (os itens do menu são fixos no código).
// Diminua a fonte e os espaços quando o menu não couber na largura da tela.
export default function MenuEditor({ initialStyle }: Props) {
  const [navStyle, setNavStyle] = useState<NavStyleData>(initialStyle ?? {});
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patchStyle(p: Partial<NavStyleData>) {
    setNavStyle((prev) => ({ ...prev, ...p }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const r = await saveNavStyle(navStyle);
      if (r.ok) setSaved(true);
      else setError(r.error ?? "Erro ao salvar");
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-accent/20 bg-accent/[0.04] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Type className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-white">Tamanho da barra de menu</h3>
        </div>
        <p className="mb-4 text-xs text-muted">
          Se o menu não couber na largura da tela (algum item cortado), <strong className="text-white">diminua o tamanho da fonte</strong> e o
          <strong className="text-white"> espaço entre itens</strong> até caber. Para mudar a <strong className="text-white">cor</strong> ou o
          tipo de fonte do menu, use <span className="text-accent">Fontes e cores do texto → Menu (navegação)</span>.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <StyleRow label="Tamanho da fonte" value={navStyle.fontScale} fallback={1} min={0.7} max={1.8} step={0.05} suffix="%" onChange={(v) => patchStyle({ fontScale: v })} />
          <StyleRow label="Altura da barra" value={navStyle.paddingY} fallback={8} min={4} max={28} onChange={(v) => patchStyle({ paddingY: v })} />
          <StyleRow label="Largura interna da barra" value={navStyle.paddingX} fallback={12} min={4} max={40} onChange={(v) => patchStyle({ paddingX: v })} />
          <StyleRow label="Espaço entre itens" value={navStyle.gap} fallback={12} min={0} max={40} onChange={(v) => patchStyle({ gap: v })} />
          <StyleRow label="Espaço interno do item" value={navStyle.itemPaddingX} fallback={12} min={4} max={36} onChange={(v) => patchStyle({ itemPaddingX: v })} />
        </div>
        <button
          type="button"
          onClick={() => { setNavStyle({}); setSaved(false); }}
          className="mt-3 text-xs text-white/50 underline underline-offset-2 hover:text-white"
        >
          Restaurar padrão
        </button>
      </div>

      <div className="sticky bottom-0 -mx-6 flex items-center gap-3 border-t border-white/10 bg-[#0f1420]/90 px-6 py-4 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar tamanho"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
