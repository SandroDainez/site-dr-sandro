import type { CSSProperties } from "react";
import type { HeaderData } from "@/lib/content";

type Props = {
  header: HeaderData;
  variant?: "lg" | "sm"; // lg = home, sm = páginas internas
};

// Monta a string de filtros de cor da imagem (só inclui o que foge do padrão).
function buildFilter(h: HeaderData): string | undefined {
  const parts: string[] = [];
  if (h.logoBrightness != null && h.logoBrightness !== 100) parts.push(`brightness(${h.logoBrightness}%)`);
  if (h.logoContrast != null && h.logoContrast !== 100) parts.push(`contrast(${h.logoContrast}%)`);
  if (h.logoSaturate != null && h.logoSaturate !== 100) parts.push(`saturate(${h.logoSaturate}%)`);
  if (h.logoGrayscale) parts.push(`grayscale(${h.logoGrayscale}%)`);
  if (h.logoInvert) parts.push(`invert(${h.logoInvert}%)`);
  if (h.logoHue) parts.push(`hue-rotate(${h.logoHue}deg)`);
  return parts.length ? parts.join(" ") : undefined;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function SiteLogo({ header: h, variant = "lg" }: Props) {
  const k = variant === "lg" ? 1 : 0.5; // páginas internas = metade do tamanho

  // Defaults que reproduzem o visual atual. Tudo passa por limites seguros para
  // que nenhum valor salvo (mesmo extremo) consiga quebrar o layout/navegação.
  const baseSize = variant === "lg" ? 192 : 96;
  const size = (h.logoSize ? clamp(h.logoSize, 96, 224) * k : baseSize);
  const pad = clamp(h.logoPadding != null ? h.logoPadding : 14, 0, 40) * k;
  const radius = clamp(h.logoRadius != null ? h.logoRadius : 24, 0, 112) * k;
  const offX = clamp(h.logoOffsetX ?? 0, -16, 16) * k;
  const offY = clamp(h.logoOffsetY ?? 0, -16, 16) * k;
  const imgScale = clamp(h.logoScale ?? 1, 0.5, 1.5);
  const bg = h.logoBg || "#ffffff";
  const showBorder = h.logoBorder !== false;
  const showShadow = h.logoShadow !== false;

  const frameStyle: CSSProperties = {
    width: `min(${size}px, ${variant === "lg" ? 42 : 22}vw)`,
    aspectRatio: "1 / 1",
    padding: pad,
    borderRadius: radius,
    background: bg === "transparent" ? "transparent" : bg,
    transform: offX || offY ? `translate(${offX}px, ${offY}px)` : undefined,
    border: showBorder ? "1px solid rgba(255,255,255,0.15)" : "none",
    boxShadow: showShadow
      ? variant === "lg"
        ? "0 0 56px rgba(44,230,184,0.30)"
        : "0 0 24px rgba(44,230,184,0.20)"
      : "none",
  };

  const imgStyle: CSSProperties = {
    transform: imgScale !== 1 ? `scale(${imgScale})` : undefined,
    filter: buildFilter(h),
  };

  return (
    <div className="flex shrink-0 items-center justify-center overflow-hidden" style={frameStyle}>
      {/* <img> normal (NÃO next/image): na Vercel o next/image recebe "&dpl=<deploy>"
          no src do HTML do servidor, mas o cliente renderiza sem — divergência que
          causava erro de hidratação (#418) e quebrava os cliques da página inteira. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={h.logoUrl}
        alt="Logo"
        width={192}
        height={192}
        decoding="async"
        className="h-full w-full object-contain"
        style={imgStyle}
      />
    </div>
  );
}
