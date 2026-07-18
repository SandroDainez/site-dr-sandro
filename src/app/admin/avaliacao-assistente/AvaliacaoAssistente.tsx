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

export default function AvaliacaoAssistente() {
  const [rodando, setRodando] = useState(false);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [resultados, setResultados] = useState<Nota[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function rodar() {
    setRodando(true); setErro(null); setResumo(null); setResultados(null);
    try {
      const r = await fetch("/api/admin/eval-assistente", { method: "POST" });
      const j = await r.json();
      if (!r.ok) { setErro(j.error ?? "Falha ao rodar a avaliação."); return; }
      setResumo(j.resumo); setResultados(j.resultados);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede.");
    } finally {
      setRodando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div>
          <p className="text-sm font-semibold text-white">Rodar a prova do assistente</p>
          <p className="mt-0.5 text-xs text-white/50 max-w-xl">Faz cada pergunta do banco ao assistente real (biblioteca → PubMed → IA → guardrails) e um juiz-IA compara com o seu gabarito. Pode levar 1-2 minutos.</p>
        </div>
        <button type="button" onClick={rodar} disabled={rodando} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
          {rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {rodando ? "Rodando…" : "Rodar avaliação"}
        </button>
      </div>

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
