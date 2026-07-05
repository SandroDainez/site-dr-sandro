"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAviso } from "@/app/admin/actions";
import type { AvisoData } from "@/lib/content";

export default function AvisoEditor({ initial }: { initial: AvisoData }) {
  const router = useRouter();
  const [ativo, setAtivo] = useState(initial.ativo);
  const [texto, setTexto] = useState(initial.texto);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function salvar() {
    setErr(null); setMsg(null);
    start(async () => {
      const r = await saveAviso({ ativo, texto });
      if (r.ok) { setMsg("Salvo. Recarregue o site (Cmd+Shift+R) para ver."); router.refresh(); }
      else setErr(r.error);
    });
  }

  return (
    <div className="space-y-5">
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-5 w-5 accent-accent" />
        <span className="text-sm font-medium text-white">Mostrar o aviso no site</span>
      </label>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/45">Texto do aviso</label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          placeholder="Ex.: 🚧 Plataforma em construção — algumas coisas ainda podem falhar."
        />
      </div>

      {/* Prévia */}
      <div>
        <p className="mb-1.5 text-xs uppercase tracking-[0.1em] text-white/45">Prévia</p>
        {texto.trim() ? (
          <div className="flex items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 px-6 py-2 text-center text-sm font-medium text-amber-200">
            {texto}
          </div>
        ) : (
          <p className="text-sm text-white/30">(sem texto)</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={salvar} disabled={pending} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:opacity-50">
          {pending ? "Salvando…" : "Salvar"}
        </button>
        {msg && <span className="text-sm text-accent">{msg}</span>}
        {err && <span className="text-sm text-red-400">{err}</span>}
      </div>
    </div>
  );
}
