import { NextRequest, NextResponse } from "next/server";
import { getAnalytics, writeBlob } from "@/lib/content";

// Filtro simples de bots (não conta robôs/preview)
const BOT = /bot|crawl|spider|slurp|bing|google|facebook|whatsapp|telegram|preview|fetch|monitor|headless|lighthouse|vercel|uptime/i;

// Data no fuso de Brasília (UTC-3)
function brDate(): string {
  return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ua = req.headers.get("user-agent") || "";
    if (!ua || BOT.test(ua)) return NextResponse.json({ ok: true, skipped: true });

    const date = brDate();
    const cookieName = "vd_" + date.replace(/-/g, "");
    const isUnique = !req.cookies.get(cookieName);

    const data = await getAnalytics();
    const day = data[date] || { v: 0, u: 0 };
    day.v += 1;
    if (isUnique) day.u += 1;
    data[date] = day;

    // mantém só os últimos ~400 dias
    const keys = Object.keys(data).sort();
    if (keys.length > 400) {
      for (const k of keys.slice(0, keys.length - 400)) delete data[k];
    }

    await writeBlob("analytics", data);

    const res = NextResponse.json({ ok: true });
    if (isUnique) {
      res.cookies.set(cookieName, "1", {
        maxAge: 60 * 60 * 36, // ~36h (cobre o dia)
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
    return res;
  } catch {
    return NextResponse.json({ ok: false });
  }
}
