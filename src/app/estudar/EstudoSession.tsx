"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, ArrowRight, RefreshCw, Award } from "lucide-react";
import { getSessao, responder, type QuestaoSessao } from "./actions";

const AREAS = [
  { v: "todas", label: "Todas" },
  { v: "anestesiologia", label: "Anestesiologia" },
  { v: "terapia_intensiva", label: "Terapia Intensiva" },
  { v: "emergencias", label: "Emergência" },
];

export default function EstudoSession() {
  const [area, setArea] = useState("todas");
  const [qs, setQs] = useState<QuestaoSessao[]>([]);
  const [pendentes, setPendentes] = useState(0);
  const [idx, setIdx] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [res, setRes] = useState<{ certo: boolean; correta: number; explicacao?: string } | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async (a: string) => {
    setCarregando(true); setQs([]); setIdx(0); setEscolha(null); setRes(null); setAcertos(0);
    const s = await getSessao(a);
    setQs(s.questoes); setPendentes(s.pendentes); setCarregando(false);
  }, []);

  useEffect(() => { carregar(area); }, [area, carregar]);

  const q = qs[idx];
  const fim = !carregando && qs.length > 0 && idx >= qs.length;

  async function responderEscolha(op: number) {
    if (escolha !== null || enviando || !q) return;
    setEscolha(op); setEnviando(true);
    const r = await responder(q.id, op);
    setEnviando(false);
    if (r.ok) { setRes({ certo: !!r.certo, correta: r.correta!, explicacao: r.explicacao }); if (r.certo) setAcertos((a) => a + 1); }
  }
  function proxima() { setIdx((i) => i + 1); setEscolha(null); setRes(null); }

  return (
    <div>
      {/* filtro de área */}
      <div className="mb-5 flex flex-wrap gap-2">
        {AREAS.map((a) => (
          <button key={a.v} onClick={() => setArea(a.v)} className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${area === a.v ? "border-accent/50 bg-accent/15 text-accent" : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25"}`}>{a.label}</button>
        ))}
      </div>

      {carregando && <p className="text-sm text-white/50">Carregando questões…</p>}

      {!carregando && qs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center text-sm text-white/50">
          Ainda não há questões nesta área. O banco é alimentado no admin (e pode ser gerado por IA a partir do seu conteúdo).
        </div>
      )}

      {fim && (
        <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-6 text-center">
          <Award className="mx-auto h-9 w-9 text-accent" />
          <p className="mt-2 text-xl font-bold text-white">Sessão concluída!</p>
          <p className="mt-1 text-sm text-white/60">{acertos} de {qs.length} corretas · {Math.round((acertos / qs.length) * 100)}%</p>
          <button onClick={() => carregar(area)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90"><RefreshCw className="h-4 w-4" /> Nova sessão</button>
          <p className="mt-3 text-xs text-white/40">As questões erradas voltam logo; as certas, mais pra frente (repetição espaçada).</p>
        </div>
      )}

      {q && !fim && (
        <div>
          <div className="mb-3 flex items-center justify-between text-xs text-white/45">
            <span>Questão {idx + 1} de {qs.length}</span>
            {pendentes > 0 && <span className="text-accent">{pendentes} pendentes de revisão</span>}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-medium leading-relaxed text-white">{q.enunciado}</p>
            <div className="mt-4 space-y-2">
              {q.opcoes.map((op, oi) => {
                const correta = res && oi === res.correta;
                const erradaEscolhida = res && escolha === oi && oi !== res.correta;
                return (
                  <button key={oi} onClick={() => responderEscolha(oi)} disabled={escolha !== null}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      correta ? "border-accent/50 bg-accent/15 text-accent"
                      : erradaEscolhida ? "border-red-400/50 bg-red-400/15 text-red-300"
                      : escolha === oi ? "border-white/40 bg-white/10 text-white"
                      : "border-white/12 bg-white/[0.02] text-white/75 hover:border-white/25"}`}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-semibold">
                      {correta ? <Check className="h-3.5 w-3.5" /> : erradaEscolhida ? <X className="h-3.5 w-3.5" /> : String.fromCharCode(65 + oi)}
                    </span>
                    {op}
                  </button>
                );
              })}
            </div>
            {res && (
              <div className={`mt-4 rounded-xl border-l-2 px-3 py-2 text-sm ${res.certo ? "border-accent/50 text-accent" : "border-red-400/50 text-red-300"}`}>
                <p className="font-semibold">{res.certo ? "Correto!" : "Resposta incorreta."}</p>
                {res.explicacao && <p className="mt-1 text-white/60">{res.explicacao}</p>}
              </div>
            )}
          </div>
          {res && (
            <button onClick={proxima} className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90">
              {idx + 1 >= qs.length ? "Ver resultado" : "Próxima"} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
