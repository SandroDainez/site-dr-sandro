"use client";

import { useState, useTransition } from "react";
import { Save, Plus, Trash2, ArrowUp, ArrowDown, Menu as MenuIcon } from "lucide-react";
import type { NavItemData } from "@/lib/content";
import { saveNavItems } from "@/app/admin/actions";

type Props = {
  initialItems: NavItemData[];
};

export default function MenuEditor({ initialItems }: Props) {
  const [items, setItems] = useState<NavItemData[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function touched() {
    setSaved(false);
  }

  function update(i: number, field: keyof NavItemData, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
    touched();
  }

  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    touched();
  }

  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    touched();
  }

  function add() {
    setItems((prev) => [...prev, { label: "Novo item", href: "#" }]);
    touched();
  }

  function handleSave() {
    setError(null);
    const clean = items
      .map((it) => ({ label: it.label.trim(), href: it.href.trim() }))
      .filter((it) => it.label);
    startTransition(async () => {
      const res = await saveNavItems(clean);
      if (res.ok) {
        setSaved(true);
        setItems(clean);
      } else setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-accent/20 bg-accent/[0.04] p-4 text-sm text-white/70">
        Itens do menu do topo do site. Arraste a ordem com as setas, edite o texto e o link, exclua
        ou adicione. <strong className="text-white">Link</strong>: use <code className="text-accent">#cursos</code> para
        rolar até uma seção da home, <code className="text-accent">/protocolos</code> para uma página, ou um endereço
        completo <code className="text-accent">https://…</code>.
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2">
              <MenuIcon className="h-4 w-4 shrink-0 text-white/30" />
              <input
                type="text"
                value={item.label}
                onChange={(e) => update(i, "label", e.target.value)}
                placeholder="Texto do item"
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
              />
              <input
                type="text"
                value={item.href}
                onChange={(e) => update(i, "href", e.target.value)}
                placeholder="#secao ou /pagina"
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none transition focus:border-accent/50"
              />
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/30 text-white transition hover:bg-white/10 disabled:opacity-30" title="Subir">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/30 text-white transition hover:bg-white/10 disabled:opacity-30" title="Descer">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove(i)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 transition hover:bg-red-400/20" title="Excluir">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <Plus className="h-4 w-4" /> Adicionar item
      </button>

      <div className="sticky bottom-0 -mx-6 flex items-center gap-3 border-t border-white/10 bg-[#07090f]/90 px-6 py-4 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar menu"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
