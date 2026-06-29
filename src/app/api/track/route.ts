import { NextRequest, NextResponse } from "next/server";
import { getAnalytics, getAnalyticsDetail, writeBlob } from "@/lib/content";

// Filtro simples de bots (não conta robôs/preview)
const BOT = /bot|crawl|spider|slurp|bing|google|facebook|whatsapp|telegram|preview|fetch|monitor|headless|lighthouse|vercel|uptime/i;

// Data no fuso de Brasília (UTC-3)
function brDate(): string {
  return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

// Classifica a origem (referrer) em rótulos amigáveis. Vazio/mesmo domínio = "Direto".
function classificarRef(ref: string): string {
  if (!ref) return "Direto";
  let host = "";
  try { host = new URL(ref).hostname.replace(/^www\./, ""); } catch { return "Direto"; }
  if (!host || host.includes("medcampus.com.br") || host.includes("site-dr-sandro")) return "Direto";
  if (/google\./.test(host)) return "Google";
  if (/instagram/.test(host)) return "Instagram";
  if (/facebook|fb\./.test(host)) return "Facebook";
  if (/youtube|youtu\.be/.test(host)) return "YouTube";
  if (/whatsapp|wa\.me/.test(host)) return "WhatsApp";
  if (/t\.co|twitter|x\.com/.test(host)) return "X/Twitter";
  if (/linkedin|lnkd/.test(host)) return "LinkedIn";
  if (/t\.me|telegram/.test(host)) return "Telegram";
  if (/bing\./.test(host)) return "Bing";
  return host; // outro site externo: mostra o domínio
}

const rotuloPath = (p: string): string => ((p || "/").split("?")[0].slice(0, 60) || "/");
const incr = (m: Record<string, number>, k: string) => { m[k] = (m[k] || 0) + 1; };
// trava de crescimento: mantém só as top ~100 chaves de um mapa
function podar(m: Record<string, number>, max = 100) {
  const ks = Object.keys(m);
  if (ks.length <= max) return;
  const top = new Set(ks.sort((a, b) => m[b] - m[a]).slice(0, max));
  for (const k of ks) if (!top.has(k)) delete m[k];
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

    // Agregados detalhados: página, origem e dispositivo
    try {
      let body: any = {};
      try { body = await req.json(); } catch {}
      const detalhe = await getAnalyticsDetail();
      incr(detalhe.paths, rotuloPath(String(body.path || "/")));
      incr(detalhe.refs, classificarRef(String(body.ref || "")));
      incr(detalhe.dev, /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? "Celular/tablet" : "Computador");
      podar(detalhe.paths); podar(detalhe.refs);
      await writeBlob("analyticsDetail", detalhe);
    } catch { /* detalhe é best-effort */ }

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
