"use client";

import { useEffect } from "react";

// Registra o service worker (offline + instalável). Silencioso se não suportado.
export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
