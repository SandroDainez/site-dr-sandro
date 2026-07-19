"use client";

import { useState } from "react";
import { Loader2, Play, AlertTriangle, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

type NotaReal = {
  pergunta: string; resposta: string; fontes: string;
  fidelidade: number; semFonte: boolean;
  risco: "ok" | "atencao" | "alto"; problemas: string[]; comentario: string;
};

const BATCH = 4; // perguntas por chamada — cada uma re-roda o assistente (custo), então lote pequeno.
const ordemRisco = { alto: 0, atencao: 1, ok: 2 } as const;

function RiscoBadge({ r }: { r: NotaReal["risco"] }) {
  if (r === "alto") return <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold text-rose-200"><AlertTriangle className="h-3 w-3" /> RISCO ALTO</span>;
  if (r === "atencao") return <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-200"><AlertCircle className="h-3 w-3" /> ATENÇÃO</span>;
  return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200"><CheckCircle2 className="h-3 w-3" /> OK</span>;
}

export default function AmostraTrafego() {
  const [rodando, setRodando] = useState(false);
  const [dias, setDias] = useState(30);
  const [quantas, setQuantas] = useState(12);
  const [resultados, setResultados] = useState<NotaReal[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [prog, setProg] = useState<{ feito: number; alvo: number } | null>(null);
  const [aberto, setAberto] = useState<Set<number>>(new Set());

  async function rodar() {
    setRodando(true); setErro(null); setResultados(null); setProg(null); setAberto(new Set());
    const acc: NotaReal[] = [];
    try {
      let offset = 0;
      while (acc.length < quantas) {
        const r = await fetch("/api/admin/amostra-trafego", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dias, offset, limit: BATCH }),
        });
        const raw = await r.text();
        let j: { resultados?: NotaReal[]; total?: number; error?: string };
        try { j = JSON.parse(raw); } catch { throw new Error("O servidor demorou demais ou reiniciou. Tente menos perguntas."); }
        if (!r.ok) throw new Error(j.error ?? "Falha ao amostrar.");
        const lote = j.resultados ?? [];
        acc.push(...lote);
        const total = j.total ?? acc.length;
        setProg({ feito: acc.length, alvo: Math.min(quantas, total) });
        setResultados([...acc].sort((a, b) => ordemRisco[a.risco] - ordemRisco[b.risco]));
        offset += BATCH;
        if (offset >= total || lote.length === 0) break; // acabou o tráfego disponível
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede.");
    } finally {
      setRodando(false); setProg(null);
    }
  }

  const resumo = resultados && {
    total: resultados.length,
    alto: resultados.filter((r) => r.risco === "alto").length,
    atencao: resultados.filter((r) => r.risco === "atencao").length,
    ok: resultados.filter((r) => r.risco === "ok").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs text-white/60">
            Período
            <select value={dias} disabled={rodando} onChange={(e) => setDias(Number(e.target.value))} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
              <option value={365}>Último ano</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/60">
            Quantas perguntas
            <select value={quantas} disabled={rodando} onChange={(e) => setQuantas(Number(e.target.value))} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={20}>20</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={rodar} disabled={rodando} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
          {rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {rodando ? "Amostrando…" : "Amostrar"}
        </button>
      </div>

      {prog && rodando && (
        <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-3">
          <p className="text-[12px] text-white/70">Auditando <strong className="text-accent">{prog.feito}/{prog.alvo}</strong> perguntas reais (re-roda cada uma no assistente)…</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.round((prog.feito / Math.max(1, prog.alvo)) * 100)}%` }} />
          </div>
        </div>
      )}

      {erro && <p className="text-sm text-rose-300">{erro}</p>}

      {resumo && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"><p className="text-2xl font-semibold text-white">{resumo.total}</p><p className="mt-1 text-[11px] uppercase tracking-wide text-white/40">Amostradas</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"><p className={`text-2xl font-semibold ${resumo.alto ? "text-rose-300" : "text-emerald-300"}`}>{resumo.alto}</p><p className="mt-1 text-[11px] uppercase tracking-wide text-white/40">Risco alto</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"><p className={`text-2xl font-semibold ${resumo.atencao ? "text-amber-300" : "text-white"}`}>{resumo.atencao}</p><p className="mt-1 text-[11px] uppercase tracking-wide text-white/40">Atenção</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"><p className="text-2xl font-semibold text-emerald-300">{resumo.ok}</p><p className="mt-1 text-[11px] uppercase tracking-wide text-white/40">OK</p></div>
        </div>
      )}

      {resultados && resultados.length === 0 && !rodando && (
        <p className="text-sm text-white/50">Nenhuma pergunta real encontrada nesse período. Assim que os usuários usarem o assistente, elas aparecem aqui.</p>
      )}

      <div className="space-y-2">
        {resultados?.map((r, i) => {
          const cor = r.risco === "alto" ? "border-rose-400/25 bg-rose-400/[0.04]" : r.risco === "atencao" ? "border-amber-400/20 bg-amber-400/[0.03]" : "border-white/10 bg-white/[0.02]";
          const isOpen = aberto.has(i);
          return (
            <div key={i} className={`rounded-xl border p-4 ${cor}`}>
              <div className="flex flex-wrap items-center gap-2">
                <RiscoBadge r={r.risco} />
                {r.semFonte && <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">SEM FONTE</span>}
                <span className="ml-auto text-[11px] text-white/40">fidelidade {r.fidelidade}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-white">{r.pergunta}</p>
              {r.problemas.length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {r.problemas.map((p, k) => <li key={k} className="text-[12px] text-rose-200/90">⚠ {p}</li>)}
                </ul>
              )}
              {r.comentario && <p className="mt-1 text-[12px] text-white/60">{r.comentario}</p>}
              {r.resposta && (
                <div className="mt-2">
                  <button type="button" onClick={() => setAberto((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })} className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white/80 transition">
                    <ChevronDown className={`h-3 w-3 transition ${isOpen ? "rotate-180" : ""}`} /> {isOpen ? "Ocultar" : "Ver"} a resposta que o usuário recebeu
                  </button>
                  {isOpen && (
                    <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-white/80">{r.resposta}</p>
                      {r.fontes && <p className="mt-2 border-t border-white/10 pt-2 text-[11px] text-white/40">Fontes: {r.fontes}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
