"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { zerarAcessos } from "./actions";

export default function ZerarButton() {
  const [busy, start] = useTransition();
  const [confirmar, setConfirmar] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function go() {
    setMsg(null);
    start(async () => {
      const r = await zerarAcessos();
      setMsg(r.ok ? "✓ Acessos zerados." : (r.error ?? "Erro ao zerar."));
      setConfirmar(false);
    });
  }

  return (
    <div className="mt-3">
      {!confirmar ? (
        <button type="button" onClick={() => setConfirmar(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-rose-400/40 hover:text-rose-300">
          <Trash2 className="h-3.5 w-3.5" /> Zerar acessos
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/60">Apagar todo o histórico de acessos? Não dá para desfazer.</span>
          <button type="button" onClick={go} disabled={busy}
            className="inline-flex items-center gap-1 rounded-full bg-rose-500/85 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Sim, zerar
          </button>
          <button type="button" onClick={() => setConfirmar(false)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60 transition hover:text-white">Cancelar</button>
        </div>
      )}
      {msg && <p className="mt-1.5 text-xs text-accent">{msg}</p>}
    </div>
  );
}
