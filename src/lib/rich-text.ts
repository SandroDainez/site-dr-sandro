// Sanitização leve para o HTML de texto rico vindo do admin (cores/tamanhos).
// Conteúdo é do próprio dono (admin protegido), mas ainda assim removemos o que
// for perigoso (scripts, handlers on*, javascript:) antes de renderizar no site.
export function sanitizeRichText(html: string | undefined): string {
  if (!html) return "";
  let out = html;
  // texto colado de fontes JSON/IA pode vir com escapes LITERAIS ("\n", "\r\n", "\t")
  // em vez de quebras reais — o whitespace-pre-wrap só respeita quebras reais, então
  // o "\n" apareceria como texto na tela. Normalizamos para a quebra/tab de verdade.
  out = out.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  // remove tags perigosas e seu conteúdo
  out = out.replace(/<\/?(script|style|iframe|object|embed|link|meta)[^>]*>/gi, "");
  // remove handlers inline (onClick=, onerror=, etc.)
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // remove protocolos perigosos
  out = out.replace(/javascript:/gi, "");
  return out;
}
