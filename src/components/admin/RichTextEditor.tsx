"use client";

import { useEffect, useRef } from "react";
import { Bold, Eraser, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

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

  // Garante uma seleção: se nada estiver selecionado (ou fora do editor),
  // seleciona TODO o texto — assim os botões funcionam mesmo sem selecionar.
  function ensureSelection() {
    const el = ref.current;
    if (!el) return null;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return null;
    const inside =
      sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer);
    if (!inside || sel.isCollapsed) {
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    return sel;
  }

  // envolve a seleção atual num <span> com o estilo dado
  function wrap(style: Partial<CSSStyleDeclaration>) {
    const el = ref.current;
    if (!el) return;
    const sel = ensureSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
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
    ensureSelection();
    document.execCommand("bold");
    emit();
  }

  // Alinhamento via span display:block (válido dentro de <p>, ao contrário de <div>)
  function align(textAlign: "left" | "center" | "right") {
    wrap({ display: "block", textAlign });
  }

  function clearFormat() {
    ensureSelection();
    document.execCommand("removeFormat");
    emit();
  }

  // mantém a seleção ao clicar nos botões da barra
  const keepSel = (e: React.MouseEvent) => e.preventDefault();

  const toolBtn =
    "flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] text-white/70 transition hover:bg-white/10 hover:text-white";

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
        <button type="button" onMouseDown={keepSel} onClick={() => align("left")} title="Alinhar à esquerda" className={toolBtn}>
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={keepSel} onClick={() => align("center")} title="Centralizar" className={toolBtn}>
          <AlignCenter className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={keepSel} onClick={() => align("right")} title="Alinhar à direita" className={toolBtn}>
          <AlignRight className="h-3.5 w-3.5" />
        </button>
        <span className="mx-2 h-4 w-px bg-white/15" />
        <button type="button" onMouseDown={keepSel} onClick={applyBold} title="Negrito" className={toolBtn}>
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={keepSel} onClick={clearFormat} title="Limpar formatação" className={toolBtn}>
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
        Dica: selecione um trecho para formatar só ele — ou clique direto num botão para aplicar no texto todo.
      </p>
    </div>
  );
}
