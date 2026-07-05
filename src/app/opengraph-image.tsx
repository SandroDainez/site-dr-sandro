import { ImageResponse } from "next/og";

export const alt = "Dr. Sandro Dainez — Atualização médica em emergências, terapia intensiva e anestesiologia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagem de compartilhamento (Open Graph / Twitter). Estática, gerada no build.
// Mantida na identidade visual do site (fundo escuro + acento teal).
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0f1420",
          backgroundImage:
            "radial-gradient(900px 500px at 78% -10%, rgba(45,212,191,0.20), transparent), radial-gradient(700px 500px at 0% 120%, rgba(59,130,246,0.14), transparent)",
          padding: "72px 80px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 9999, backgroundColor: "#2dd4bf" }} />
          <div style={{ fontSize: 26, letterSpacing: 4, color: "#5eead4", fontWeight: 600 }}>
            ATUALIZAÇÃO MÉDICA DIGITAL
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Dr. Sandro Dainez
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "rgba(255,255,255,0.72)", marginTop: 22, maxWidth: 980 }}>
            Apoio à decisão em medicina de urgência, terapia intensiva e anestesiologia.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: "#f87171" }} />
            <div style={{ fontSize: 28, color: "#fca5a5", fontWeight: 600 }}>Emergências</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: "#60a5fa" }} />
            <div style={{ fontSize: 28, color: "#93c5fd", fontWeight: 600 }}>Terapia Intensiva</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: "#a78bfa" }} />
            <div style={{ fontSize: 28, color: "#c4b5fd", fontWeight: 600 }}>Anestesiologia</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
