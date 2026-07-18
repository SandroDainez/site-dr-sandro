"use client";

import { useState } from "react";
import { Loader2, Play, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type Nota = {
  id: string; tema: string; risco: string;
  correcao: number; cobertura: number; fidelidade: number;
  doseOk: boolean | null; reconheceuIncerteza: boolean; citouFonte: boolean;
  erroGrave: boolean; erroGraveDesc: string; aprovado: boolean; comentario: string;
};
type Resumo = {
  total: number; aprovadas: number; errosGraves: number; dosesErradas: number;
  correcao: number; cobertura: number; fidelidade: number; citouFonte: number;
};

function Metric({ label, value, suf = "%", bom }: { label: string; value: number | string; suf?: string; bom?: boolean }) {
  const cor = bom === undefined ? "text-white" : bom ? "text-emerald-300" : "text-rose-300";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
      <p className={`text-2xl font-semibold ${cor}`}>{value}{typeof value === "number" ? suf : ""}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-white/40">{label}</p>
    </div>
  );
}

function montarResumo(rs: Nota[]): Resumo {
  const n = rs.length || 1;
  const media = (k: (r: Nota) => number) => Math.round(rs.reduce((s, r) => s + k(r), 0) / n);
  return {
    total: rs.length,
    aprovadas: rs.filter((r) => r.aprovado).length,
    errosGraves: rs.filter((r) => r.erroGrave).length,
    dosesErradas: rs.filter((r) => r.doseOk === false).length,
    correcao: media((r) => r.correcao),
    cobertura: media((r) => r.cobertura),
    fidelidade: media((r) => r.fidelidade),
    citouFonte: rs.filter((r) => r.citouFonte).length,
  };
}

const BATCH = 6; // questões por chamada — evita estourar o tempo da função serverless

export default function AvaliacaoAssistente() {
  const [rodando, setRodando] = useState(false);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [resultados, setResultados] = useState<Nota[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [progresso, setProgresso] = useState<{ feito: number; total: number } | null>(null);

  async function rodar(somenteSentinelas: boolean) {
    setRodando(true); setErro(null); setResumo(null); setResultados(null); setProgresso(null);
    const acc: Nota[] = [];
    let offset = 0, total = Infinity;
    try {
      while (offset < total) {
        const r = await fetch("/api/admin/eval-assistente", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ somenteSentinelas, offset, limit: BATCH }),
        });
        const raw = await r.text();
        let j: { resultados?: Nota[]; total?: number; error?: string };
        try { j = JSON.parse(raw); }
        catch { setErro("O servidor demorou demais ou reiniciou. Tente as sentinelas (mais rápido) ou rode de novo."); return; }
        if (!r.ok) { setErro(j.error ?? "Falha ao rodar a avaliação."); return; }
        acc.push(...(j.resultados ?? []));
        total = j.total ?? acc.length;
        offset += BATCH;
        setProgresso({ feito: Math.min(acc.length, total), total });
        setResultados([...acc]);
        setResumo(montarResumo(acc));
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede.");
    } finally {
      setRodando(false); setProgresso(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div>
          <p className="text-sm font-semibold text-white">Rodar a prova do assistente</p>
          <p className="mt-0.5 text-xs text-white/50 max-w-xl">Faz cada pergunta do banco ao assistente real (biblioteca → PubMed → IA → guardrails) e um juiz-IA compara com o seu gabarito. <strong className="text-white/70">Sentinelas</strong> (risco alto/dose) roda rápido; <strong className="text-white/70">tudo</strong> é o exame completo (mais lento).</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => rodar(true)} disabled={rodando} className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50">
            {rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Rodar sentinelas
          </button>
          <button type="button" onClick={() => rodar(false)} disabled={rodando} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
            {rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {rodando ? "Rodando…" : "Rodar tudo (68)"}
          </button>
        </div>
      </div>

      {progresso && rodando && (
        <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-3">
          <p className="text-[12px] text-white/70">Rodando… <strong className="text-accent">{progresso.feito}/{progresso.total}</strong> questões avaliadas (o placar vai preenchendo conforme avança).</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.round((progresso.feito / Math.max(1, progresso.total)) * 100)}%` }} />
          </div>
        </div>
      )}

      {erro && <p className="text-sm text-rose-300">{erro}</p>}

      {resumo && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Aprovadas" value={`${resumo.aprovadas}/${resumo.total}`} bom={resumo.aprovadas === resumo.total} />
            <Metric label="Erros de dose" value={resumo.dosesErradas} suf="" bom={resumo.dosesErradas === 0} />
            <Metric label="Erros graves" value={resumo.errosGraves} suf="" bom={resumo.errosGraves === 0} />
            <Metric label="Citou fonte" value={`${resumo.citouFonte}/${resumo.total}`} />
            <Metric label="Correção clínica" value={resumo.correcao} bom={resumo.correcao >= 85} />
            <Metric label="Cobertura" value={resumo.cobertura} bom={resumo.cobertura >= 85} />
            <Metric label="Fidelidade à fonte" value={resumo.fidelidade} bom={resumo.fidelidade >= 85} />
            <Metric label="Total de questões" value={resumo.total} suf="" />
          </div>

          <div className="space-y-2">
            {resultados?.map((r) => (
              <div key={r.id} className={`rounded-xl border p-4 ${r.aprovado ? "border-emerald-400/20 bg-emerald-400/[0.03]" : "border-rose-400/25 bg-rose-400/[0.04]"}`}>
                <div className="flex items-center gap-2">
                  {r.aprovado ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <XCircle className="h-4 w-4 text-rose-300" />}
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{r.id} · {r.tema} · risco {r.risco}</span>
                  {r.erroGrave && <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold text-rose-200"><AlertTriangle className="h-3 w-3" /> ERRO GRAVE</span>}
                  {r.doseOk === false && <span className="rounded-full border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold text-rose-200">DOSE ERRADA</span>}
                  <span className="ml-auto text-[11px] text-white/50">corr {r.correcao} · cob {r.cobertura} · fid {r.fidelidade}</span>
                </div>
                {r.erroGraveDesc && <p className="mt-1.5 text-[12px] text-rose-200/90">⚠ {r.erroGraveDesc}</p>}
                {r.comentario && <p className="mt-1 text-[12px] text-white/60">{r.comentario}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
