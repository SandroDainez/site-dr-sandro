export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAnalytics, getAnalyticsDetail } from "@/lib/content";
import ZerarButton from "./ZerarButton";

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

  // Detalhes acumulados: páginas, origem, dispositivo
  const detalhe = await getAnalyticsDetail();
  const topList = (m: Record<string, number>, n = 8) =>
    Object.entries(m).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v).slice(0, n);
  const topPaths = topList(detalhe.paths);
  const topRefs = topList(detalhe.refs);
  const topDev = topList(detalhe.dev, 3);
  const totRefs = topRefs.reduce((a, x) => a + x.v, 0) || 1;
  const diretoPct = Math.round(((detalhe.refs["Direto"] || 0) / (Object.values(detalhe.refs).reduce((a, b) => a + b, 0) || 1)) * 100);
  const temDetalhe = topPaths.length > 0 || topRefs.length > 0;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Acessos ao site</h1>
        <p className="mt-1 text-sm text-white/50">
          Visitas ao site (páginas públicas). <strong className="text-white/70">Visualizações</strong> = aberturas de página;{" "}
          <strong className="text-white/70">Visitantes</strong> = pessoas distintas no dia. Robôs são ignorados.
        </p>
        <ZerarButton />
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

      {/* Detalhes: de onde vêm, o que veem, em que aparelho */}
      {temDetalhe && (
        <>
          {/* "É gente de verdade ou sou eu?" */}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/75">
            {diretoPct >= 80 ? (
              <p>🔎 <strong className="text-white">{diretoPct}%</strong> dos acessos são <strong>diretos</strong> (digitaram o endereço ou é você testando). Quando aparecerem origens como <strong>Google</strong> ou <strong>Instagram</strong> abaixo, são pessoas <strong>descobrindo</strong> o site de fora.</p>
            ) : (
              <p>🎉 Boa parte do tráfego vem de <strong className="text-accent">fontes externas</strong> (veja abaixo) — ou seja, são pessoas chegando de fora, não só você testando.</p>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Origem do tráfego */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-3 text-sm font-semibold text-white">De onde vêm (origem)</p>
              <div className="space-y-2.5">
                {topRefs.map((r) => (
                  <div key={r.k}>
                    <div className="mb-1 flex items-center justify-between text-xs"><span className="text-white/75">{r.k}</span><span className="font-semibold text-white/55">{r.v}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.round((r.v / totRefs) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Páginas mais vistas */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-3 text-sm font-semibold text-white">Páginas mais vistas</p>
              <div className="space-y-2 text-sm">
                {topPaths.map((p) => (
                  <div key={p.k} className="flex items-center justify-between gap-2">
                    <span className="truncate text-white/75">{p.k === "/" ? "/ (início)" : p.k}</span>
                    <span className="shrink-0 font-semibold text-white/55">{p.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dispositivo */}
          {topDev.length > 0 && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-3 text-sm font-semibold text-white">Aparelho usado</p>
              <div className="flex flex-wrap gap-3">
                {topDev.map((d) => (
                  <span key={d.k} className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm text-white/75">{d.k}: <strong className="text-white">{d.v}</strong></span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent/[0.05] px-4 py-3 text-xs leading-relaxed text-white/70">
        <span aria-hidden>✅</span>
        <p>
          <strong className="text-accent">Como ler isto:</strong> <strong className="text-white/80">Visualizações</strong> = quantas páginas foram abertas. <strong className="text-white/80">Visitantes</strong> = pessoas distintas no dia. <strong className="text-white/80">Origem</strong> = de onde a pessoa veio (Direto = digitou o endereço ou é você; Google/Instagram = veio de fora). Robôs são ignorados. Para um painel ainda mais completo, há também <strong className="text-white/80">vercel.com → site-dr-sandro → Analytics</strong>.
        </p>
      </div>
    </div>
  );
}
