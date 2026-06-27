import { createPublicClient, supabaseConfigured } from "@/lib/supabase/server";
import { ESPECIALIDADE_LABELS } from "@/lib/agents/utils";
import type { Especialidade } from "@/types/medical";
import { Sparkles } from "lucide-react";

// Atualização clínica da semana gerada pelos agentes de IA (Supabase).
// Tema escuro, no estilo do site. Se o Supabase não estiver configurado ou não
// houver dados ainda, renderiza null — o hub segue normal.

const ORIGEM_BADGE: Record<string, { label: string; css: string }> = {
  pubmed: { label: "PubMed", css: "border-green-400/30 bg-green-400/10 text-green-300" },
  rss: { label: "Journal", css: "border-blue-400/30 bg-blue-400/10 text-blue-300" },
  sociedade: { label: "Sociedade", css: "border-violet-400/30 bg-violet-400/10 text-violet-300" },
  regulatorio: { label: "Regulatório", css: "border-red-400/30 bg-red-400/10 text-red-300" },
  lilacs: { label: "LILACS/BVS", css: "border-teal-400/30 bg-teal-400/10 text-teal-300" },
  scielo: { label: "SciELO", css: "border-teal-400/30 bg-teal-400/10 text-teal-300" },
  openalex: { label: "OpenAlex", css: "border-sky-400/30 bg-sky-400/10 text-sky-300" },
  clinicaltrials: { label: "Clinical Trial", css: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  fda: { label: "FDA Alert", css: "border-red-400/30 bg-red-400/10 text-red-300" },
  nice: { label: "NICE", css: "border-indigo-400/30 bg-indigo-400/10 text-indigo-300" },
  who: { label: "WHO", css: "border-blue-400/30 bg-blue-400/10 text-blue-300" },
};

const TIPO_DESTAQUE = ["guideline", "posicionamento", "alerta", "resolucao", "regulatorio"];

export default async function AtualizacaoSemanal({ especialidade }: { especialidade: Especialidade }) {
  if (!supabaseConfigured()) return null;

  let update: any = null;
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("medical_updates")
      .select("*")
      .eq("especialidade", especialidade)
      .eq("publicado", true)
      .order("data_publicacao", { ascending: false })
      .limit(1)
      .maybeSingle();
    update = data;
  } catch {
    return null;
  }

  if (!update) return null;

  const dataFormatada = new Date(update.data_publicacao).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const fontesPorOrigem = (update.fontes ?? []).reduce((acc: Record<string, number>, f: any) => {
    acc[f.origem] = (acc[f.origem] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="mb-10 overflow-hidden rounded-3xl border border-accent/25 bg-accent/[0.04] p-6 md:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white/45">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-semibold text-accent">
          <Sparkles className="h-3.5 w-3.5" /> Atualização da semana
        </span>
        <span>·</span>
        <span>{ESPECIALIDADE_LABELS[especialidade]}</span>
        <span>·</span>
        <span>{update.semana_referencia}</span>
        <span>·</span>
        <span>{dataFormatada}</span>
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{update.titulo}</h2>
      {update.resumo && <p className="mt-2 leading-relaxed text-white/65">{update.resumo}</p>}

      {/* Fontes consultadas */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {Object.entries(fontesPorOrigem).map(([origem, count]) => {
          const badge = ORIGEM_BADGE[origem];
          if (!badge) return null;
          return (
            <span key={origem} className={`rounded-full border px-2 py-0.5 text-[11px] ${badge.css}`}>
              {badge.label} ({count as number})
            </span>
          );
        })}
      </div>

      {/* Tópicos */}
      {update.topicos?.length > 0 && (
        <div className="mt-6 space-y-3">
          {update.topicos.map((topico: any, i: number) => {
            const isDestaque = TIPO_DESTAQUE.includes(topico.fonte_tipo);
            return (
              <div key={i} className={`space-y-2 rounded-2xl p-4 ${isDestaque ? "border border-amber-400/30 bg-amber-400/[0.06]" : "border border-white/10 bg-white/[0.03]"}`}>
                {isDestaque && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                    ★ Novo {topico.fonte_tipo}{topico.fonte_nome ? ` — ${topico.fonte_nome}` : ""}
                  </span>
                )}
                <h3 className="font-semibold text-white">{topico.titulo}</h3>
                <p className="text-sm leading-relaxed text-white/70">{topico.descricao}</p>
                {topico.relevancia_clinica && (
                  <div className="mt-2 border-l-2 border-accent/50 pl-3">
                    <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">Relevância clínica</p>
                    <p className="text-sm text-white/60">{topico.relevancia_clinica}</p>
                  </div>
                )}
                {!isDestaque && topico.fonte_nome && <p className="text-xs text-white/35">Fonte: {topico.fonte_nome}</p>}
                {topico.pmid && (
                  <a href={`https://pubmed.ncbi.nlm.nih.gov/${topico.pmid}/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent transition hover:opacity-80">
                    PubMed PMID:{topico.pmid} ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Referências (recolhível, sem JS) */}
      {update.fontes?.length > 0 && (
        <details className="group mt-5">
          <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-wide text-white/45 transition hover:text-white/70">
            Referências consultadas ({update.fontes.length}) <span className="ml-1 inline-block transition group-open:rotate-180">▾</span>
          </summary>
          <ul className="mt-3 space-y-2">
            {update.fontes.map((fonte: any, i: number) => {
              const badge = ORIGEM_BADGE[fonte.origem];
              return (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 shrink-0 text-white/30">{i + 1}.</span>
                  <div className="flex-1">
                    <span className="text-white/70">{fonte.titulo}</span>
                    <span className="text-white/40"> · {fonte.journal}</span>
                    {fonte.ano && <span className="text-white/40"> ({fonte.ano})</span>}
                    <div className="mt-0.5 flex items-center gap-2">
                      {badge && <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${badge.css}`}>{badge.label}</span>}
                      <a href={fonte.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent transition hover:opacity-80">Ver fonte ↗</a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}
