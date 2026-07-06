import type { CSSProperties } from "react";

// Estilo da grade configurável (classe .card-grid no globals.css). Degrada em degraus:
// desktop = N cheio; tablet (≤1023) = até 3; pequeno (≤767) = até 2; celular (≤539) = 1.
export function colStyle(n?: number): CSSProperties {
  const c = Math.max(1, Math.min(Math.round(n ?? 3), 6));
  return {
    "--cols": c,
    "--cols-t": Math.min(c, 3),
    "--cols-s": Math.min(c, 2),
  } as CSSProperties;
}
