// Corpo de uma atualização clínica (resumo + fontes + tópicos + referências).
// Presentational (sem fetch, sem hooks) — usado no hub (última da semana) e no
// histórico. Tema escuro.

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

export default function UpdateContent({ update }: { update: any }) {
  const fontesPorOrigem = (update.fontes ?? []).reduce((acc: Record<string, number>, f: any) => {
    acc[f.origem] = (acc[f.origem] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {update.resumo && <p className="leading-relaxed text-white/65">{update.resumo}</p>}

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

      {update.topicos?.length > 0 && (
        <div className="mt-6 space-y-3">
          {update.topicos.map((topico: any, i: number) => {
            const isDestaque = TIPO_DESTAQUE.includes(topico.fonte_tipo);
            // Link da fonte: URL direta do tópico, ou PubMed (PMID), ou casa o nome
            // da fonte com a lista de referências (que tem as URLs).
            const fontes = update.fontes ?? [];
            const matchFonte = topico.fonte_nome
              ? fontes.find((f: any) => f.journal && (f.journal === topico.fonte_nome || f.journal.includes(topico.fonte_nome) || topico.fonte_nome.includes(f.journal)))
              : null;
            const fonteUrl: string | null =
              topico.fonte_url ||
              (topico.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${topico.pmid}/` : null) ||
              matchFonte?.url ||
              null;
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
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                  {topico.fonte_nome && <span className="text-xs text-white/35">Fonte: {topico.fonte_nome}</span>}
                  {fonteUrl && (
                    <a href={fonteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-accent transition hover:opacity-80">
                      {topico.pmid ? `PubMed PMID:${topico.pmid}` : "Ver fonte"} ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
