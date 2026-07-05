"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { gerarMelhoria } from "./actions";

type Lacuna = { tema?: string; evidencia?: string; sugestao?: string; tipo?: string; prioridade?: string };
type Conteudo = {
  resumo?: string;
  lacunas?: Lacuna[];
  perguntas_sem_resposta?: string[];
  acoes?: string[];
  dados?: { totalBuscas?: number; totalPerguntas?: number; buscasSemResultado?: number; perguntasSemFonte?: number };
};
export type Relatorio = { gerado_em: string; resumo: string; conteudo: Conteudo } | null;

const prioCor: Record<string, string> = {
  alta: "border-red-400/40 bg-red-400/10 text-red-300",
  media: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  baixa: "border-white/15 bg-white/[0.04] text-white/60",
};

export default function MelhoriaPanel({ inicial }: { inicial: Relatorio }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const r = inicial;
  const c = r?.conteudo ?? {};

  function gerar() {
    setErro(null); setMsg(null);
    startTransition(async () => {
      const res = await gerarMelhoria();
      if (res.ok) { setMsg("Relatório gerado!"); router.refresh(); }
      else setErro(res.error ?? "Falha ao gerar.");
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button" onClick={gerar} disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Analisando…</> : <><Sparkles className="h-4 w-4" /> Gerar relatório agora</>}
        </button>
        {r && <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white"><RefreshCw className="h-3.5 w-3.5" /> Atualizar</button>}
        {msg && <span className="text-sm text-accent">✓ {msg}</span>}
        {erro && <span className="text-sm text-red-400">{erro}</span>}
      </div>

      {!r ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
          <p className="text-sm text-white/55">Nenhum relatório ainda. Clique em <strong>Gerar relatório agora</strong> ou aguarde a execução automática (toda segunda).</p>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-white/40">Gerado em {new Date(r.gerado_em + "T12:00:00").toLocaleDateString("pt-BR")}</p>

          <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-5">
            <p className="text-sm leading-relaxed text-white/85">{c.resumo || r.resumo}</p>
            {c.dados && (
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-white/45">
                <span>🔎 {c.dados.totalBuscas ?? 0} buscas (30d)</span>
                <span>💬 {c.dados.totalPerguntas ?? 0} perguntas ao assistente</span>
                <span>⚠️ {c.dados.buscasSemResultado ?? 0} termos sem resultado</span>
                <span>❓ {c.dados.perguntasSemFonte ?? 0} perguntas sem resposta no portal</span>
              </div>
            )}
          </div>

          {(c.lacunas?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Lacunas de conteúdo</p>
              <div className="space-y-3">
                {c.lacunas!.map((l, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{l.tema}</span>
                      {l.prioridade && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${prioCor[l.prioridade] ?? prioCor.baixa}`}>{l.prioridade}</span>}
                      {l.tipo && <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/55">{l.tipo}</span>}
                    </div>
                    {l.evidencia && <p className="text-xs text-white/50">📊 {l.evidencia}</p>}
                    {l.sugestao && <p className="mt-1 text-sm text-white/75">→ {l.sugestao}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(c.acoes?.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Ações prioritárias</p>
              <ul className="space-y-1.5 text-sm text-white/80">
                {c.acoes!.map((a, i) => <li key={i} className="flex gap-2"><span className="text-accent">{i + 1}.</span> {a}</li>)}
              </ul>
            </div>
          )}

          {(c.perguntas_sem_resposta?.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Perguntas que o assistente não respondeu</p>
              <ul className="space-y-1 text-sm text-white/65">
                {c.perguntas_sem_resposta!.map((p, i) => <li key={i}>• {p}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
