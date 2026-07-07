"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Faixa de aviso no topo do site (ex.: "em construção"). Dispensável pelo usuário:
// ao fechar, guarda no localStorage por HASH do texto — se o admin mudar o texto,
// o aviso reaparece (é um aviso novo).
export default function SiteAviso({ texto }: { texto: string }) {
  const [show, setShow] = useState(false);
  const key =
    "aviso-dispensado:" +
    Array.from(texto).reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(localStorage.getItem(key) !== "1");
    } catch {
      setShow(true);
    }
  }, [key]);

  if (!show || !texto.trim()) return null;

  return (
    <div className="relative z-[70] flex items-center justify-center gap-3 border-b border-amber-400/25 bg-amber-400/10 px-10 py-2 text-center text-xs font-medium text-amber-200 sm:text-sm">
      <span>{texto}</span>
      <button
        type="button"
        onClick={() => {
          try { localStorage.setItem(key, "1"); } catch {}
          setShow(false);
        }}
        aria-label="Fechar aviso"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-amber-200/70 transition hover:bg-amber-400/10 hover:text-amber-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
