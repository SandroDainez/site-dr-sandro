// A fonte padrão do @react-pdf (Helvetica) NÃO tem alguns glifos comuns em texto clínico
// (μ grego, ≥, ≤, subscritos, sinal de menos, checkboxes, setas). Sem tratar, saem como
// lixo no PDF ("SvO‚", "¼g", checkbox vazio). Trocamos por equivalentes que renderizam,
// preservando o sentido. Usado por protocolo-pdf e boletim-pdf. (Upgrade futuro: fonte Unicode.)
const SUB = "₀₁₂₃₄₅₆₇₈₉";
export function pdfSafe(str: string): string {
  return (str || "")
    .replace(/μ/g, "µ") // μ (grego) -> µ (micro sign, renderavel)
    .replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/≠/g, "!=").replace(/±/g, "+/-")
    .replace(/[−–—]/g, "-") // menos (U+2212) + travessoes -> hifen (formula do PAPi)
    .replace(/[₀-₉]/g, (d) => String(SUB.indexOf(d))) // subscritos: SvO₂ -> SvO2
    .replace(/[☐□▢]/g, "[ ]").replace(/[☑☒■]/g, "[x]") // checkboxes
    .replace(/×/g, "x").replace(/÷/g, "/").replace(/·/g, ".")
    .replace(/→/g, "->").replace(/←/g, "<-").replace(/↔/g, "<->")
    .replace(/↑/g, "^").replace(/↓/g, "|") // setas verticais (fluxograma)
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/ /g, " "); // nbsp -> espaco normal
}
