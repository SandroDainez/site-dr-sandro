"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";

// Botão "Instalar app" — aparece só quando o navegador permite instalar (Android/Chrome/Edge).
// No iPhone (Safari) a instalação é via Compartilhar → "Adicionar à Tela de Início".
export default function InstallButton() {
  const [evt, setEvt] = useState<any>(null);
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.("(display-mode: standalone)").matches) { setOculto(true); return; }
    const onPrompt = (e: any) => { e.preventDefault(); setEvt(e); };
    const onInstalled = () => setOculto(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (oculto || !evt) return null;
  return (
    <button
      type="button"
      onClick={async () => { evt.prompt(); try { await evt.userChoice; } catch {} setEvt(null); }}
      className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20"
    >
      <Download className="h-4 w-4" /> Instalar app
    </button>
  );
}
