// A fonte padrão do @react-pdf (Helvetica) NÃO tem alguns glifos comuns em texto clínico
// (μ grego, ≥, ≤, setas, aspas curvas). Sem tratar, saíam como lixo no PDF ("¼g", "e90",
// "d30", setas quebradas). Trocamos por equivalentes que renderizam, preservando o sentido.
// Usado por protocolo-pdf e boletim-pdf. (Upgrade futuro: embutir uma fonte Unicode.)
export function pdfSafe(str: string): string {
  return (str || "")
    .replace(/μ/g, "µ") // μ (grego, U+03BC) → µ (micro sign, U+00B5, renderável)
    .replace(/≥/g, ">=").replace(/≤/g, "<=")
    .replace(/→/g, "->").replace(/←/g, "<-").replace(/↔/g, "<->")
    .replace(/↑/g, "^").replace(/↓/g, "|") // setas verticais (fluxograma)
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/…/g, "...").replace(/[–—]/g, "-")
    .replace(/ /g, " "); // nbsp → espaço normal
}
