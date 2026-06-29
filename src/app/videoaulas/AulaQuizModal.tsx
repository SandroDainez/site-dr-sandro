"use client";

import { useEffect, useState } from "react";
import type { VideoaulaData } from "@/lib/content";

type Fase = "intro" | "pre" | "video" | "pos" | "resultado";
type Respostas = Record<number, number>;

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return m ? m[1] : null;
}

function corrigir(quiz: NonNullable<VideoaulaData["quiz"]>, r: Respostas): number {
  let acertos = 0;
  quiz.forEach((q, i) => { if (r[i] === q.correta) acertos++; });
  return acertos;
}

// Lista de questões com alternativas (radio). Reutilizada no pré e no pós.
function QuizForm({
  quiz, respostas, setResposta, onSubmit, titulo, cta,
}: {
  quiz: NonNullable<VideoaulaData["quiz"]>;
  respostas: Respostas;
  setResposta: (qi: number, oi: number) => void;
  onSubmit: () => void;
  titulo: string;
  cta: string;
}) {
  const completo = quiz.every((_, i) => respostas[i] !== undefined);
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-white">{titulo}</h3>
      <div className="space-y-5">
        {quiz.map((q, qi) => (
          <div key={qi}>
            <p className="mb-2 text-sm font-medium text-white"><span className="text-accent">{qi + 1}.</span> {q.enunciado}</p>
            <div className="space-y-1.5">
              {q.opcoes.map((o, oi) => (
                <label key={oi} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${respostas[qi] === oi ? "border-accent/50 bg-accent/10 text-white" : "border-white/10 bg-white/[0.02] text-white/75 hover:border-white/25"}`}>
                  <input type="radio" name={`q-${qi}`} checked={respostas[qi] === oi} onChange={() => setResposta(qi, oi)} className="accent-accent" />
                  {o}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button" onClick={onSubmit} disabled={!completo}
        className="mt-6 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-40"
      >
        {completo ? cta : "Responda todas as questões"}
      </button>
    </div>
  );
}

export default function AulaQuizModal({ item, onClose }: { item: VideoaulaData; onClose: () => void }) {
  const quiz = item.quiz ?? [];
  const total = quiz.length;
  const ytId = item.videoUrl ? getYoutubeId(item.videoUrl) : null;

  const [fase, setFase] = useState<Fase>("intro");
  const [pulouPre, setPulouPre] = useState(false);
  const [resPre, setResPre] = useState<Respostas>({});
  const [resPos, setResPos] = useState<Respostas>({});
  const [scorePre, setScorePre] = useState<number | null>(null);
  const [scorePos, setScorePos] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  function enviarPre() { setScorePre(corrigir(quiz, resPre)); setFase("video"); }
  function enviarPos() {
    const s = corrigir(quiz, resPos);
    setScorePos(s);
    setFase("resultado");
    // Salva o resultado (o servidor só persiste se o usuário estiver logado).
    fetch("/api/videoaula-quiz", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoaulaId: item.id, titulo: item.titulo, total, scorePre, scorePos: s }),
    }).catch(() => {});
  }

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/90 backdrop-blur-sm p-4 py-10" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b0e15] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-white/50 transition hover:text-white">✕</button>

        {/* INTRO */}
        {fase === "intro" && (
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{item.titulo}</p>
            <h3 className="mt-3 text-xl font-semibold text-white">Quer medir seu conhecimento?</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/60">
              Faça um teste rápido <strong>antes</strong> da aula e <strong>o mesmo</strong> teste depois — assim você vê sua evolução. É <strong>opcional</strong>.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => setFase("pre")} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90">
                Fazer o pré-teste ({total} {total === 1 ? "questão" : "questões"})
              </button>
              <button type="button" onClick={() => { setPulouPre(true); setFase("video"); }} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/75 transition hover:text-white">
                Pular e assistir
              </button>
            </div>
          </div>
        )}

        {/* PRÉ-TESTE */}
        {fase === "pre" && (
          <QuizForm quiz={quiz} respostas={resPre} setResposta={(qi, oi) => setResPre((r) => ({ ...r, [qi]: oi }))} onSubmit={enviarPre} titulo="Pré-teste — antes da aula" cta="Enviar e assistir à aula" />
        )}

        {/* VÍDEO */}
        {fase === "video" && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-white">{item.titulo}</h3>
            <div className="overflow-hidden rounded-xl bg-black">
              {ytId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                  title={item.titulo} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                  className="aspect-video w-full"
                />
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={item.videoUrl} controls autoPlay playsInline className="w-full" style={{ maxHeight: "60vh" }} />
              )}
            </div>
            <button type="button" onClick={() => setFase("pos")} className="mt-5 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#07090f] transition hover:opacity-90">
              Já assisti — fazer o pós-teste
            </button>
          </div>
        )}

        {/* PÓS-TESTE */}
        {fase === "pos" && (
          <QuizForm quiz={quiz} respostas={resPos} setResposta={(qi, oi) => setResPos((r) => ({ ...r, [qi]: oi }))} onSubmit={enviarPos} titulo="Pós-teste — depois da aula" cta="Ver meu resultado" />
        )}

        {/* RESULTADO */}
        {fase === "resultado" && scorePos !== null && (
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white">Seu resultado</h3>
            <div className="mt-5 flex items-center justify-center gap-4">
              {!pulouPre && scorePre !== null && (
                <>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                    <p className="text-[11px] uppercase tracking-wide text-white/45">Antes</p>
                    <p className="mt-1 text-2xl font-bold text-white/80">{pct(scorePre)}%</p>
                    <p className="text-[11px] text-white/40">{scorePre}/{total}</p>
                  </div>
                  <span className="text-2xl text-accent">→</span>
                </>
              )}
              <div className="rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4">
                <p className="text-[11px] uppercase tracking-wide text-accent">Depois</p>
                <p className="mt-1 text-2xl font-bold text-accent">{pct(scorePos)}%</p>
                <p className="text-[11px] text-white/40">{scorePos}/{total}</p>
              </div>
            </div>
            {!pulouPre && scorePre !== null && (
              <p className="mt-4 text-sm text-white/70">
                {scorePos > scorePre
                  ? `📈 Evolução de +${pct(scorePos) - pct(scorePre)} pontos percentuais. Mandou bem!`
                  : scorePos === scorePre
                    ? "Você manteve seu desempenho. Que tal rever os pontos que errou?"
                    : "Revise o material — o pós ficou abaixo do pré."}
              </p>
            )}
            {pulouPre && <p className="mt-4 text-sm text-white/60">Você pulou o pré-teste. Da próxima vez, faça o pré pra ver sua evolução completa.</p>}

            {/* Gabarito comentado — revisão de cada questão (baseado no pós-teste) */}
            <div className="mt-6 space-y-2 text-left">
              <p className="text-sm font-semibold text-white">Gabarito comentado</p>
              {quiz.map((q, qi) => {
                const escolha = resPos[qi];
                const acertou = escolha === q.correta;
                return (
                  <div key={qi} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-sm font-medium text-white">{qi + 1}. {q.enunciado}</p>
                    <p className={`mt-1 text-xs ${acertou ? "text-accent" : "text-red-300"}`}>
                      {acertou ? "✓ Você acertou" : `✗ Você marcou: ${q.opcoes[escolha] ?? "—"}`}
                    </p>
                    {!acertou && <p className="text-xs text-white/75">Correta: <strong>{q.opcoes[q.correta]}</strong></p>}
                    {q.justificativa && <p className="mt-1 text-xs leading-relaxed text-white/55">💡 {q.justificativa}</p>}
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={onClose} className="mt-6 rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-white/80 transition hover:text-white">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
