// Formatação de data DETERMINÍSTICA — servidor e cliente produzem o MESMO texto.
//
// Por que isto existe: `new Date("2025-01-15")` é interpretado como meia-noite
// UTC. No servidor da Vercel (fuso UTC) isso renderiza "15/jan"; no navegador do
// usuário (Brasília, UTC−3) "volta" para "14/jan". O HTML do servidor então
// difere do que o React monta no cliente → erro de hidratação #418 (e a árvore é
// re-renderizada no cliente). Além disso, `toLocaleDateString` depende da versão
// do ICU (servidor × navegador), o que pode variar abreviações de mês.
//
// Solução: extrair ano/mês/dia direto da string (sem objeto Date, sem fuso, sem
// ICU) e montar o texto à mão. Assim o resultado é idêntico em qualquer ambiente.

const MES_CURTO = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
const MES_LONGO = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function partes(data: string | undefined | null): { y: number; m: number; d: number } | null {
  if (!data) return null;
  // pega a PARTE de data ("YYYY-MM-DD") de qualquer string ISO, ignorando hora/fuso
  const m = String(data).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

/** "15 jan 2025" */
export function dataCurta(data: string | undefined | null): string {
  const p = partes(data);
  if (!p) return data ? String(data) : "";
  return `${String(p.d).padStart(2, "0")} ${MES_CURTO[p.m - 1]} ${p.y}`;
}

/** "15 de janeiro de 2025" */
export function dataLonga(data: string | undefined | null): string {
  const p = partes(data);
  if (!p) return data ? String(data) : "";
  return `${p.d} de ${MES_LONGO[p.m - 1]} de ${p.y}`;
}

/** "janeiro de 2025" */
export function mesAno(data: string | undefined | null): string {
  const p = partes(data);
  if (!p) return data ? String(data) : "";
  return `${MES_LONGO[p.m - 1]} de ${p.y}`;
}
