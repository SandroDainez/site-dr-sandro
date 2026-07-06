// Monta o destino final do QR a partir do que o admin digitou + o tipo escolhido.
// Assim o admin pode digitar só o número e o link certo é montado (WhatsApp, ligação
// ou site). Determinístico (mesma entrada → mesma saída), seguro p/ hidratação.

export type QrTipo = "whatsapp" | "tel" | "url";

export const QR_TIPOS: { value: QrTipo; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp (abre a conversa)" },
  { value: "tel", label: "Ligação (disca o número)" },
  { value: "url", label: "Site / link (abre a página)" },
];

// dígitos com código do país: se vier sem (≤11 dígitos, padrão BR), prefixa 55.
function digitosComPais(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (!d) return "";
  if (d.length <= 11) d = "55" + d;
  return d;
}

export function qrTarget(link: string | undefined, tipo: QrTipo = "whatsapp"): string {
  const raw = (link ?? "").trim();
  if (!raw) return "";

  // Se já colaram um link pronto de WhatsApp/http, respeita.
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(wa\.me|api\.whatsapp\.com)/i.test(raw)) return "https://" + raw;

  if (tipo === "whatsapp") {
    const d = digitosComPais(raw);
    return d ? `https://wa.me/${d}` : "";
  }
  if (tipo === "tel") {
    const d = digitosComPais(raw);
    return d ? `tel:+${d}` : "";
  }
  // url: adiciona https:// se faltou
  return "https://" + raw.replace(/^\/+/, "");
}
