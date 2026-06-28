import { ImageResponse } from "next/og";

const S = 512;

export function GET() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0a1020,#07090f)" }}>
        <div style={{ position: "relative", width: S * 0.5, height: S * 0.5, display: "flex" }}>
          <div style={{ position: "absolute", left: S * 0.2, top: 0, width: S * 0.1, height: S * 0.5, background: "#2ce6b8", borderRadius: 12 }} />
          <div style={{ position: "absolute", top: S * 0.2, left: 0, width: S * 0.5, height: S * 0.1, background: "#2ce6b8", borderRadius: 12 }} />
        </div>
      </div>
    ),
    { width: S, height: S }
  );
}
