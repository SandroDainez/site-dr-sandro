export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/supabase/auth-server";
import { getHeader } from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import AuthButton from "@/components/AuthButton";
import { Flame, Trophy, Target, BarChart3, Lock, Brain } from "lucide-react";
import { getDesempenho } from "./analytics";

export const metadata = { title: "Meu desempenho" };

export default async function DesempenhoPage() {
  const [user, header] = await Promise.all([getUsuario(), getHeader()]);
  if (!user) redirect("/entrar?next=/desempenho");
  const d = await getDesempenho();

  const maxAtiv = Math.max(1, ...(d?.atividade.map((a) => a.respostas) ?? [1]));

  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-6 py-4">
          <a href="/minha-area" className="flex items-center gap-3"><SiteLogo header={header} variant="sm" />{header.name && <p className="hidden text-lg font-bold tracking-tight text-white sm:block">{header.name}</p>}</a>
          <AuthButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent"><BarChart3 className="h-5 w-5" /></span>
          <div><h1 className="text-xl font-semibold tracking-tight">Meu desempenho</h1><p className="text-xs text-white/45">Sua evolução, forças e fraquezas.</p></div>
        </div>

        {!d || (d.totalRespostas === 0 && d.videoaulas.length === 0) ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
            <Brain className="mx-auto mb-3 h-8 w-8 text-white/30" />
            <p className="text-sm text-white/55">Responda questões em <a href="/estudar" className="text-accent">/estudar</a> ou faça o teste de uma <a href="/videoaulas" className="text-accent">videoaula</a> para ver sua evolução aqui.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Topo: ofensiva, nível, acerto */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4 text-center">
                <Flame className="mx-auto h-6 w-6 text-amber-300" />
                <p className="mt-1 text-2xl font-bold text-white">{d.ofensiva}</p>
                <p className="text-[11px] text-white/50">dia{d.ofensiva === 1 ? "" : "s"} de ofensiva</p>
              </div>
              <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-4 text-center">
                <Trophy className="mx-auto h-6 w-6 text-accent" />
                <p className="mt-1 text-2xl font-bold text-white">Nível {d.nivel}</p>
                <p className="text-[11px] text-white/50">{d.xp} XP</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <Target className="mx-auto h-6 w-6 text-white/70" />
                <p className="mt-1 text-2xl font-bold text-white">{d.pctGeral}%</p>
                <p className="text-[11px] text-white/50">{d.totalRespostas} respondidas</p>
              </div>
            </div>

            {/* progresso de nível */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-white/55"><span>Progresso do nível {d.nivel}</span><span className="font-semibold text-accent">{d.xpNivel}/{d.xpProxNivel} XP</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-accent" style={{ width: `${(d.xpNivel / d.xpProxNivel) * 100}%` }} /></div>
            </div>

            {/* atividade 14 dias */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Atividade — últimos 14 dias</p>
              <div className="flex items-end justify-between gap-1" style={{ height: 64 }}>
                {d.atividade.map((a, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: "100%" }} title={`${a.dia}: ${a.respostas}`}>
                    <div className={`w-full rounded-sm ${a.respostas ? "bg-accent" : "bg-white/8"}`} style={{ height: `${Math.max(a.respostas ? 8 : 3, (a.respostas / maxAtiv) * 100)}%` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* por área */}
            {d.porArea.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Acerto por área</p>
                <div className="space-y-3">
                  {d.porArea.map((a) => (
                    <div key={a.area}>
                      <div className="mb-1 flex items-center justify-between text-xs"><span className="text-white/75">{a.label}</span><span className="font-semibold text-white/55">{a.pct}% · {a.respostas} q.</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${a.pct >= 70 ? "bg-accent" : a.pct >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${a.pct}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* evolução pré/pós das videoaulas */}
            {d.videoaulas.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Evolução nas videoaulas (pré → pós)</p>
                <div className="space-y-3">
                  {d.videoaulas.map((v) => (
                    <div key={v.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="mb-2 text-sm font-medium text-white">{v.titulo}</p>
                      <div className="flex items-center gap-3 text-sm">
                        {v.pctPre !== null ? (
                          <>
                            <span className="text-white/55">Antes <span className="font-bold text-white/80">{v.pctPre}%</span></span>
                            <span className="text-accent">→</span>
                            <span className="text-white/55">Depois <span className="font-bold text-accent">{v.pctPos}%</span></span>
                            {v.ganho !== null && (
                              <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${v.ganho > 0 ? "bg-accent/15 text-accent" : v.ganho === 0 ? "bg-white/10 text-white/60" : "bg-amber-400/15 text-amber-300"}`}>
                                {v.ganho > 0 ? `📈 +${v.ganho}` : v.ganho === 0 ? "= 0" : `▼ ${v.ganho}`} pts
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-white/55">Pós-teste: <span className="font-bold text-accent">{v.pctPos}%</span> <span className="text-[11px] text-white/35">(sem pré-teste)</span></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* conquistas */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Conquistas</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {d.conquistas.map((c) => (
                  <div key={c.id} className={`rounded-xl border p-3 text-center ${c.obtida ? "border-accent/40 bg-accent/[0.07]" : "border-white/10 bg-white/[0.02] opacity-55"}`}>
                    {c.obtida ? <Trophy className="mx-auto h-5 w-5 text-accent" /> : <Lock className="mx-auto h-5 w-5 text-white/30" />}
                    <p className="mt-1.5 text-xs font-semibold text-white">{c.titulo}</p>
                    <p className="text-[10px] text-white/45">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
