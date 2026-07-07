"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw } from "lucide-react";
import { NAV_GROUPS, type NavOverride } from "@/lib/nav-structure";
import { saveNavMenu } from "@/app/admin/actions";

const ALL_TOP = NAV_GROUPS.map((g) => g.label);
const childrenDe = (label: string) => NAV_GROUPS.find((g) => g.label === label)?.children ?? [];

// ordena `todos` conforme `pref` (o que não está em pref vai pro fim, mantendo a ordem original)
function ordenar(todos: string[], pref?: string[]): string[] {
  if (!pref?.length) return todos;
  const na = todos.filter((l) => pref.includes(l)).sort((a, b) => pref.indexOf(a) - pref.indexOf(b));
  const resto = todos.filter((l) => !pref.includes(l));
  return [...na, ...resto];
}
function mover<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
}

export default function MenuOrderEditor({ initial }: { initial: NavOverride }) {
  const [topOrder, setTopOrder] = useState<string[]>(ordenar(ALL_TOP, initial.order));
  const [childOrder, setChildOrder] = useState<Record<string, string[]>>(() => {
    const o: Record<string, string[]> = {};
    for (const label of ALL_TOP) {
      const cs = childrenDe(label).map((c) => c.label);
      if (cs.length) o[label] = ordenar(cs, initial.childOrder?.[label]);
    }
    return o;
  });
  const [hidden, setHidden] = useState<Set<string>>(new Set(initial.hidden ?? []));
  const [labels, setLabels] = useState<Record<string, string>>(initial.labels ?? {});
  const [isPending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const toggleHide = (label: string) => setHidden((h) => { const n = new Set(h); if (n.has(label)) n.delete(label); else n.add(label); return n; });
  const rename = (label: string, v: string) => setLabels((l) => ({ ...l, [label]: v }));

  function salvar() {
    setMsg(null);
    const cleanLabels: Record<string, string> = {};
    for (const [k, v] of Object.entries(labels)) if (v?.trim() && v.trim() !== k) cleanLabels[k] = v.trim();
    const override: NavOverride = {
      order: topOrder,
      hidden: [...hidden],
      labels: cleanLabels,
      childOrder,
    };
    start(async () => {
      const r = await saveNavMenu(override);
      setMsg(r.ok ? "✓ Menu salvo — recarregue o site (Cmd+Shift+R) para ver." : (r.error ?? "Erro ao salvar."));
    });
  }
  function restaurar() {
    setTopOrder(ALL_TOP);
    const o: Record<string, string[]> = {};
    for (const label of ALL_TOP) { const cs = childrenDe(label).map((c) => c.label); if (cs.length) o[label] = cs; }
    setChildOrder(o); setHidden(new Set()); setLabels({});
  }

  const inputCls = "rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50";
  const btn = "rounded-md p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-25";

  const Linha = ({ label, arr, idx, setArr, indent }: { label: string; arr: string[]; idx: number; setArr: (a: string[]) => void; indent?: boolean }) => {
    const oculto = hidden.has(label);
    return (
      <div className={`flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2 ${indent ? "ml-6" : ""} ${oculto ? "opacity-45" : ""}`}>
        <div className="flex flex-col">
          <button type="button" className={btn} disabled={idx === 0} onClick={() => setArr(mover(arr, idx, -1))} title="Subir"><ChevronUp className="h-4 w-4" /></button>
          <button type="button" className={btn} disabled={idx === arr.length - 1} onClick={() => setArr(mover(arr, idx, 1))} title="Descer"><ChevronDown className="h-4 w-4" /></button>
        </div>
        <input className={`${inputCls} flex-1`} value={labels[label] ?? ""} placeholder={label} onChange={(e) => rename(label, e.target.value)} />
        <button type="button" className={btn} onClick={() => toggleHide(label)} title={oculto ? "Mostrar" : "Ocultar"}>
          {oculto ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Ordem e itens do menu principal</h3>
          <p className="mt-1 text-xs text-white/50">Reordene com ↑/↓, oculte com o olho, renomeie no campo. Não cria links novos (usa as páginas que já existem).</p>
        </div>
        <button type="button" onClick={restaurar} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60 transition hover:text-white"><RotateCcw className="h-3.5 w-3.5" /> Restaurar padrão</button>
      </div>

      <div className="space-y-2">
        {topOrder.map((label, i) => {
          const cs = childOrder[label];
          return (
            <div key={label} className="space-y-1.5">
              <Linha label={label} arr={topOrder} idx={i} setArr={setTopOrder} />
              {cs && cs.map((cl, ci) => (
                <Linha key={cl} label={cl} arr={cs} idx={ci} indent
                  setArr={(a) => setChildOrder((co) => ({ ...co, [label]: a }))} />
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={salvar} disabled={isPending} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
          {isPending ? "Salvando…" : "Salvar menu"}
        </button>
        {msg && <span className="text-sm text-accent">{msg}</span>}
      </div>
    </div>
  );
}
