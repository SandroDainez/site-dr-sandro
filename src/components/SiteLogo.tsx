import Image from "next/image";
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

export default function SiteLogo({ header: h, variant = "lg" }: Props) {
  const k = variant === "lg" ? 1 : 0.5; // páginas internas = metade do tamanho

  // Defaults que reproduzem o visual atual
  const baseSize = variant === "lg" ? 192 : 96;
  const size = (h.logoSize ? h.logoSize * k : baseSize);
  const pad = (h.logoPadding != null ? h.logoPadding : 14) * k;
  const radius = (h.logoRadius != null ? h.logoRadius : 24) * k;
  const offX = (h.logoOffsetX ?? 0) * k;
  const offY = (h.logoOffsetY ?? 0) * k;
  const imgScale = h.logoScale ?? 1;
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
      <Image
        src={h.logoUrl}
        alt="Logo"
        width={192}
        height={192}
        priority={variant === "lg"}
        unoptimized
        className="h-full w-full object-contain"
        style={imgStyle}
      />
    </div>
  );
}
