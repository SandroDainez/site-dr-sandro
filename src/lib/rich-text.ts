// Sanitização leve para o HTML de texto rico vindo do admin (cores/tamanhos).
// Conteúdo é do próprio dono (admin protegido), mas ainda assim removemos o que
// for perigoso (scripts, handlers on*, javascript:) antes de renderizar no site.
export function sanitizeRichText(html: string | undefined): string {
  if (!html) return "";
  let out = html;
  // remove tags perigosas e seu conteúdo
  out = out.replace(/<\/?(script|style|iframe|object|embed|link|meta)[^>]*>/gi, "");
  // remove handlers inline (onClick=, onerror=, etc.)
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // remove protocolos perigosos
  out = out.replace(/javascript:/gi, "");
  return out;
}
