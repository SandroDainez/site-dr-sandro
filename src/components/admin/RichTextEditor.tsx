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

  // wrapper único que envolve TODO o conteúdo (para formatar o texto inteiro
  // sem precisar selecionar e sem empilhar spans a cada clique).
  function getOrCreateWrapper(el: HTMLDivElement): HTMLSpanElement {
    const only = el.childNodes.length === 1 ? el.firstElementChild : null;
    if (only && only.tagName === "SPAN" && (only as HTMLElement).dataset.rtWrap === "1") {
      return only as HTMLSpanElement;
    }
    const span = document.createElement("span");
    span.dataset.rtWrap = "1";
    span.style.display = "block";
    while (el.firstChild) span.appendChild(el.firstChild);
    el.appendChild(span);
    return span;
  }

  // Aplica os estilos: no trecho selecionado, ou (sem seleção) no texto todo.
  function apply(setter: (s: HTMLSpanElement) => void) {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    const hasSelection =
      !!range && !range.collapsed && el.contains(range.commonAncestorContainer);

    if (hasSelection && range) {
      const span = document.createElement("span");
      setter(span);
      try {
        range.surroundContents(span);
      } catch {
        try {
          span.appendChild(range.extractContents());
          range.insertNode(span);
        } catch {
          /* seleção muito complexa — ignora */
        }
      }
      sel?.removeAllRanges();
    } else {
      setter(getOrCreateWrapper(el));
    }
    emit();
  }

  function clearFormat() {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = el.textContent || "";
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
            onClick={() => apply((s) => (s.style.color = c.hex))}
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
            onClick={() => apply((sp) => (sp.style.fontSize = s.em))}
            className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-0.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {s.label}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-white/15" />
        <button type="button" onMouseDown={keepSel} onClick={() => apply((s) => { s.style.display = "block"; s.style.textAlign = "left"; })} title="Alinhar à esquerda" className={toolBtn}>
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={keepSel} onClick={() => apply((s) => { s.style.display = "block"; s.style.textAlign = "center"; })} title="Centralizar" className={toolBtn}>
          <AlignCenter className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={keepSel} onClick={() => apply((s) => { s.style.display = "block"; s.style.textAlign = "right"; })} title="Alinhar à direita" className={toolBtn}>
          <AlignRight className="h-3.5 w-3.5" />
        </button>
        <span className="mx-2 h-4 w-px bg-white/15" />
        <button type="button" onMouseDown={keepSel} onClick={() => apply((s) => (s.style.fontWeight = "700"))} title="Negrito" className={toolBtn}>
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
