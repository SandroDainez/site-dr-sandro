"use client";

import { useEffect } from "react";

// Registra 1 acesso por carregamento de página pública (ignora /admin).
export default function TrackVisit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/admin")) return;
    fetch("/api/track", {
      method: "POST", keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, ref: document.referrer || "" }),
    }).catch(() => {});
  }, []);
  return null;
}
