"use client";

import { useEffect, useRef } from "react";
import { Bold, Eraser } from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

const COLORS = [
  { label: "Verde", hex: "#2ce6b8" },
  { label: "Azul", hex: "#5f8fff" },
  { label: "Violeta", hex: "#a78bfa" },
  { label: "Âmbar", hex: "#fbbf24" },
  { label: "Vermelho", hex: "#f87171" },
  { label: "Branco", hex: "#ffffff" },
];

const SIZES = [
  { label: "P", em: "0.85em" },
  { label: "M", em: "1em" },
  { label: "G", em: "1.3em" },
  { label: "GG", em: "1.7em" },
];

export default function RichTextEditor({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // injeta o HTML inicial uma vez (contentEditable é não-controlado)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  // envolve a seleção atual num <span> com o estilo dado
  function wrap(style: Partial<CSSStyleDeclaration>) {
    const el = ref.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    // garante que a seleção está dentro do editor
    if (!el.contains(range.commonAncestorContainer)) return;
    const span = document.createElement("span");
    Object.assign(span.style, style);
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      sel.removeAllRanges();
    } catch {
      /* seleção complexa — ignora */
    }
    emit();
  }

  function applyBold() {
    document.execCommand("bold");
    emit();
  }

  function clearFormat() {
    document.execCommand("removeFormat");
    emit();
  }

  // mantém a seleção ao clicar nos botões da barra
  const keepSel = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="rounded-xl border border-white/15 bg-black/30">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 p-2">
        <span className="mr-1 text-[10px] uppercase tracking-[0.1em] text-white/30">Cor</span>
        {COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            title={c.label}
            onMouseDown={keepSel}
            onClick={() => wrap({ color: c.hex })}
            className="h-5 w-5 rounded-full border border-white/20"
            style={{ background: c.hex }}
          />
        ))}
        <span className="mx-2 h-4 w-px bg-white/15" />
        <span className="mr-1 text-[10px] uppercase tracking-[0.1em] text-white/30">Tamanho</span>
        {SIZES.map((s) => (
          <button
            key={s.label}
            type="button"
            onMouseDown={keepSel}
            onClick={() => wrap({ fontSize: s.em })}
            className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-0.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {s.label}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-white/15" />
        <button type="button" onMouseDown={keepSel} onClick={applyBold} title="Negrito" className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] text-white/70 transition hover:bg-white/10 hover:text-white">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={keepSel} onClick={clearFormat} title="Limpar formatação" className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] text-white/70 transition hover:bg-white/10 hover:text-white">
          <Eraser className="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        className="min-h-[64px] px-3 py-2 text-sm leading-relaxed text-white outline-none [&_*]:!leading-relaxed"
      />
      <p className="px-3 pb-2 text-[10px] text-white/30">
        Selecione um trecho do texto e clique numa cor ou tamanho para destacar.
      </p>
    </div>
  );
}
