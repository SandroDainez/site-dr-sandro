import type { CSSProperties } from "react";

// Estilo da grade configurável (classe .card-grid no globals.css):
// N colunas no desktop, 2 no tablet, 1 no celular.
export function colStyle(n?: number): CSSProperties {
  const c = n ?? 3;
  return { "--cols": c, "--cols-t": Math.min(c, 2) } as CSSProperties;
}
