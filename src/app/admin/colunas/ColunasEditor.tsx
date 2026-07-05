"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CARD_COL_SECTIONS } from "@/lib/home-sections";
import { saveCardCols } from "@/app/admin/actions";

export default function ColunasEditor({ initial }: { initial: Record<string, number> }) {
  const router = useRouter();
  const [cols, setCols] = useState<Record<string, number>>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const setCol = (key: string, v: number) => setCols((c) => ({ ...c, [key]: v }));

  function salvar() {
    setErr(null); setMsg(null);
    start(async () => {
      const r = await saveCardCols(cols);
      if (r.ok) { setMsg("Salvo. Recarregue a home (Cmd+Shift+R) para ver."); router.refresh(); }
      else setErr(r.error);
    });
  }

  return (
    <div className="space-y-3">
      {CARD_COL_SECTIONS.map((s) => {
        const val = cols[s.key] ?? s.def;
        return (
          <div key={s.key} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div>
              <p className="text-sm font-semibold text-white">{s.label}</p>
              <p className="text-xs text-white/40">{val} {val === 1 ? "card" : "cards"} por linha (desktop)</p>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCol(s.key, n)}
                  className={`h-9 w-9 rounded-lg border text-sm font-semibold transition ${
                    val === n
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-white/15 bg-black/30 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={salvar}
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
        {msg && <span className="text-sm text-accent">{msg}</span>}
        {err && <span className="text-sm text-red-400">{err}</span>}
      </div>
    </div>
  );
}
