export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAnalytics } from "@/lib/content";

function brTodayParts(): { y: number; m: number; d: number } {
  const d = new Date(Date.now() - 3 * 3600 * 1000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
}
function key(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type Day = { date: string; label: string; v: number; u: number };

export default async function AdminAnalyticsPage() {
  const data = await getAnalytics();
  const t = brTodayParts();
  const today = new Date(t.y, t.m, t.d);

  const N = 30;
  const days: Day[] = [];
  for (let i = N - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = key(d);
    const rec = data[k] || { v: 0, u: 0 };
    days.push({ date: k, label: `${d.getDate()}/${d.getMonth() + 1}`, v: rec.v, u: rec.u });
  }

  const allViews = Object.values(data).reduce((a, x) => a + (x?.v || 0), 0);
  const allVisitors = Object.values(data).reduce((a, x) => a + (x?.u || 0), 0);
  const todayRec = data[key(today)] || { v: 0, u: 0 };
  const last7 = days.slice(-7);
  const sumV = (arr: Day[]) => arr.reduce((a, x) => a + x.v, 0);
  const sumU = (arr: Day[]) => arr.reduce((a, x) => a + x.u, 0);

  const hasData = allViews > 0;
  const max = Math.max(1, ...days.map((d) => d.v));

  // SVG chart
  const W = 760, H = 240, padX = 8, padTop = 12, padBottom = 28;
  const innerW = W - padX * 2;
  const bw = innerW / N;
  const chartH = H - padTop - padBottom;

  const cards = [
    { label: "Hoje", v: todayRec.v, u: todayRec.u, accent: "text-accent" },
    { label: "Últimos 7 dias", v: sumV(last7), u: sumU(last7), accent: "text-accent-blue" },
    { label: "Últimos 30 dias", v: sumV(days), u: sumU(days), accent: "text-accent-violet" },
    { label: "Total (desde o início)", v: allViews, u: allVisitors, accent: "text-amber-400" },
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Acessos ao site</h1>
        <p className="mt-1 text-sm text-white/50">
          Visitas ao site (páginas públicas). <strong className="text-white/70">Visualizações</strong> = aberturas de página;{" "}
          <strong className="text-white/70">Visitantes</strong> = pessoas distintas no dia. Robôs são ignorados.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">{c.label}</p>
            <p className={`mt-2 text-3xl font-semibold tabular-nums ${c.accent}`}>{c.v.toLocaleString("pt-BR")}</p>
            <p className="mt-1 text-xs text-white/45">{c.u.toLocaleString("pt-BR")} visitante{c.u !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Visualizações por dia (últimos 30 dias)</p>
          <span className="text-xs text-white/40">pico: {max.toLocaleString("pt-BR")}/dia</span>
        </div>

        {hasData ? (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico de visitas">
            {/* baseline */}
            <line x1={padX} y1={H - padBottom} x2={W - padX} y2={H - padBottom} stroke="rgba(255,255,255,0.12)" />
            {days.map((d, i) => {
              const h = (d.v / max) * chartH;
              const x = padX + i * bw + bw * 0.15;
              const w = bw * 0.7;
              const y = H - padBottom - h;
              return (
                <g key={d.date}>
                  <rect x={x} y={y} width={w} height={Math.max(h, d.v > 0 ? 2 : 0)} rx={2} fill="var(--accent, #2ce6b8)" opacity={0.85}>
                    <title>{`${d.label}: ${d.v} visualizações · ${d.u} visitantes`}</title>
                  </rect>
                  {(i % 5 === 0 || i === N - 1) && (
                    <text x={padX + i * bw + bw / 2} y={H - padBottom + 16} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)">
                      {d.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-white/50">Ainda sem dados de acesso.</p>
            <p className="mt-1 text-xs text-white/35">
              A contagem começa agora. Abra o site (em outra aba/celular) e os números aparecem aqui — atualize a página.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent/[0.05] px-4 py-3 text-xs leading-relaxed text-white/70">
        <span aria-hidden>✅</span>
        <p>
          <strong className="text-accent">Vercel Web Analytics ativo.</strong> Os números acima são a contagem própria do
          site (sem rastrear pessoas). Para dados mais precisos e com <strong className="text-white/80">origem do tráfego</strong>
          {" "}(Google, Instagram, direto…), páginas mais vistas e dispositivos, veja em{" "}
          <strong className="text-white/80">vercel.com → projeto site-dr-sandro → aba Analytics</strong>.
        </p>
      </div>
    </div>
  );
}
