"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Award, LogIn, RotateCcw } from "lucide-react";
import type { CursoQuestao } from "@/lib/content";
import { registrarQuiz } from "./progresso-actions";

export default function QuizView({ quiz, cursoId, notaMinima, logado }: {
  quiz: CursoQuestao[]; cursoId: string; notaMinima: number; logado: boolean;
}) {
  const router = useRouter();
  const [resp, setResp] = useState<Record<number, number>>({});
  const [enviado, setEnviado] = useState(false);
  const [res, setRes] = useState<{ nota: number; aprovado: boolean; acertos: number; total: number } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const todasRespondidas = quiz.every((_, i) => resp[i] !== undefined);

  async function enviar() {
    if (!todasRespondidas || enviando) return;
    setEnviando(true);
    const respostas = quiz.map((_, i) => resp[i]);
    if (logado) {
      const r = await registrarQuiz(cursoId, respostas);
      if (r.ok) { setRes({ nota: r.nota!, aprovado: r.aprovado!, acertos: r.acertos!, total: r.total! }); setEnviado(true); if (r.aprovado) router.refresh(); }
    } else {
      // sem login: corrige local só p/ feedback (não registra)
      const acertos = quiz.reduce((n, q, i) => n + (respostas[i] === q.correta ? 1 : 0), 0);
      const nota = Math.round((acertos / quiz.length) * 100);
      setRes({ nota, aprovado: nota >= notaMinima, acertos, total: quiz.length });
      setEnviado(true);
    }
    setEnviando(false);
  }

  function refazer() { setResp({}); setEnviado(false); setRes(null); }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Avaliação{quiz.length ? ` · ${quiz.length} questões` : ""}</h3>
        <span className="text-xs text-white/45">Aprovação: {notaMinima}%</span>
      </div>

      {res && (
        <div className={`mb-5 rounded-xl border p-4 ${res.aprovado ? "border-accent/40 bg-accent/10" : "border-red-400/30 bg-red-400/10"}`}>
          <p className={`text-lg font-bold ${res.aprovado ? "text-accent" : "text-red-300"}`}>{res.aprovado ? "Aprovado!" : "Não atingiu a nota"} — {res.nota}%</p>
          <p className="text-sm text-white/60">{res.acertos} de {res.total} corretas.</p>
          {res.aprovado && logado && (
            <a href={`/certificado/${cursoId}`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[#0f1420] transition hover:opacity-90"><Award className="h-4 w-4" /> Emitir certificado</a>
          )}
          {!logado && <a href={`/entrar?next=/cursos/${cursoId}`} className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent"><LogIn className="h-3.5 w-3.5" /> Entre para registrar a nota e emitir certificado</a>}
        </div>
      )}

      <div className="space-y-5">
        {quiz.map((q, i) => (
          <div key={q.id || i}>
            <p className="mb-2 text-sm font-medium text-white"><span className="text-white/40">{i + 1}.</span> {q.enunciado}</p>
            <div className="space-y-1.5">
              {q.opcoes.map((op, oi) => {
                const escolhida = resp[i] === oi;
                const correta = enviado && oi === q.correta;
                const erradaEscolhida = enviado && escolhida && oi !== q.correta;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={enviado}
                    onClick={() => setResp((r) => ({ ...r, [i]: oi }))}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                      correta ? "border-accent/50 bg-accent/15 text-accent"
                      : erradaEscolhida ? "border-red-400/50 bg-red-400/15 text-red-300"
                      : escolhida ? "border-white/40 bg-white/10 text-white"
                      : "border-white/12 bg-white/[0.02] text-white/70 hover:border-white/25"}`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${escolhida || correta ? "border-current" : "border-white/25"}`}>
                      {correta ? <Check className="h-3 w-3" /> : erradaEscolhida ? <X className="h-3 w-3" /> : String.fromCharCode(65 + oi)}
                    </span>
                    {op}
                  </button>
                );
              })}
            </div>
            {enviado && q.explicacao && <p className="mt-2 rounded-lg border-l-2 border-accent/40 bg-white/[0.02] px-3 py-2 text-xs text-white/55"><strong className="text-white/70">Comentário:</strong> {q.explicacao}</p>}
          </div>
        ))}
      </div>

      <div className="mt-5">
        {!enviado ? (
          <button type="button" onClick={enviar} disabled={!todasRespondidas || enviando} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-40">
            {enviando ? "Enviando…" : todasRespondidas ? "Enviar respostas" : "Responda todas as questões"}
          </button>
        ) : (
          <button type="button" onClick={refazer} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:text-white"><RotateCcw className="h-4 w-4" /> Refazer</button>
        )}
      </div>
    </div>
  );
}
