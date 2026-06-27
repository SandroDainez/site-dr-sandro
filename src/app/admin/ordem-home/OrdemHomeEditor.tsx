"use client";

import { useState, useTransition } from "react";
import { ArrowUp, ArrowDown, Save, RotateCcw } from "lucide-react";
import { saveHomeOrder } from "@/app/admin/actions";
import { DEFAULT_HOME_ORDER } from "@/lib/home-sections";

const LABELS: Record<string, string> = {
  atualizacoes: "Atualizações clínicas",
  protocolos: "Protocolos",
  procedimentos: "Procedimentos médicos",
  videoaulas: "Videoaulas",
  cursos: "Cursos",
  podcast: "Podcast",
  colaboradores: "Parceiros",
  acervo: "Acervo",
  "apps-assinatura": "Apps por assinatura",
  "apps-gratis": "Apps grátis",
  "apps-uteis": "Apps do dia a dia",
  eventos: "Eventos (calendário)",
  contato: "Contato",
};

export default function OrdemHomeEditor({ initial }: { initial: string[] }) {
  const [ordem, setOrdem] = useState<string[]>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= ordem.length) return;
    const next = [...ordem];
    [next[i], next[j]] = [next[j], next[i]];
    setOrdem(next);
    setSaved(false);
  }

  function salvar() {
    setErr(null);
    startTransition(async () => {
      const r = await saveHomeOrder(ordem);
      if (r.ok) setSaved(true);
      else setErr(r.error);
    });
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {ordem.map((id, i) => (
          <li key={id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="w-6 shrink-0 text-center text-xs font-semibold text-white/35">{i + 1}</span>
            <span className="flex-1 text-sm font-medium text-white">{LABELS[id] ?? id}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg border border-white/15 p-1.5 text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-25" title="Subir"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === ordem.length - 1} className="rounded-lg border border-white/15 p-1.5 text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-25" title="Descer"><ArrowDown className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ol>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0e14]/90 p-3 backdrop-blur">
        <button type="button" onClick={salvar} disabled={pending} className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50">
          <Save className="h-4 w-4" /> {pending ? "Salvando…" : "Salvar ordem"}
        </button>
        <button type="button" onClick={() => { setOrdem([...DEFAULT_HOME_ORDER]); setSaved(false); }} className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 transition hover:border-white/30 hover:text-white">
          <RotateCcw className="h-4 w-4" /> Padrão
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo</span>}
        {err && <span className="text-sm text-red-400">{err}</span>}
      </div>
    </div>
  );
}
