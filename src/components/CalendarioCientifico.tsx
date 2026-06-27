"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";

// Calendário + lista numerada cronológica dos eventos científicos (medical_events
// do Supabase: congressos pesquisados pela IA + eventos seus/parceiros adicionados
// no admin). Cada item leva ao site oficial.

type Ev = {
  id: string;
  titulo: string;
  data_inicio: string;
  data_fim?: string | null;
  cidade?: string | null;
  local_nome?: string | null;
  pais?: string | null;
  modalidade?: string | null;
  organizador?: string | null;
  url_oficial: string;
};

const semana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MOD_BADGE: Record<string, string> = {
  presencial: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  online: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  hibrido: "border-violet-400/30 bg-violet-400/10 text-violet-300",
};

function key(d: Date) {
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}
function fmt(iso: string) {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function CalendarioCientifico({ eventos }: { eventos: Ev[] }) {
  const [mesAtual, setMesAtual] = useState(() => {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth(), 1);
  });
  const [hojeKey, setHojeKey] = useState("");
  useEffect(() => setHojeKey(key(new Date())), []);

  const porDia = useMemo(() => {
    const m: Record<string, Ev[]> = {};
    for (const e of eventos) {
      if (!e.data_inicio) continue;
      (m[e.data_inicio] ??= []).push(e);
    }
    return m;
  }, [eventos]);

  const ordenados = useMemo(
    () => [...eventos].filter((e) => e.data_inicio).sort((a, b) => a.data_inicio.localeCompare(b.data_inicio)),
    [eventos]
  );

  const { dias, tituloMes } = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiro = new Date(ano, mes, 1);
    const ultimo = new Date(ano, mes + 1, 0);
    const ini = primeiro.getDay();
    const grid: Array<{ data: Date; fora: boolean }> = [];
    for (let i = 0; i < ini; i++) grid.push({ data: new Date(ano, mes, i - ini + 1), fora: true });
    for (let d = 1; d <= ultimo.getDate(); d++) grid.push({ data: new Date(ano, mes, d), fora: false });
    const falt = (7 - (grid.length % 7)) % 7;
    for (let i = 1; i <= falt; i++) grid.push({ data: new Date(ano, mes + 1, i), fora: true });
    return { dias: grid, tituloMes: mesAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) };
  }, [mesAtual]);

  return (
    <section id="agenda-cientifica" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24">
      <div className="finex-glass rounded-[2rem] p-8 md:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-accent">Agenda científica · automática</p>
            <h3 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">Congressos e eventos científicos</h3>
            <p className="mt-2 text-sm text-muted">Congressos do Brasil e do mundo (anestesiologia, terapia intensiva e emergências). Clique para ir ao site oficial.</p>
          </div>
          <CalendarDays className="h-8 w-8 text-accent" />
        </div>

        {/* Calendário */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => setMesAtual((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10">
              <ChevronLeft className="h-4 w-4" /> Mês anterior
            </button>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/85">{tituloMes}</p>
            <button type="button" onClick={() => setMesAtual((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10">
              Próximo mês <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2">
            {semana.map((d) => (
              <div key={d} className="rounded-xl border border-white/10 bg-white/[0.03] py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white/60">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {dias.map(({ data, fora }) => {
              const dk = key(data);
              const evs = !fora ? porDia[dk] : undefined;
              if (evs && evs.length) {
                const e = evs[0];
                return (
                  <a key={dk} href={e.url_oficial} target="_blank" rel="noopener noreferrer" className="group card-open relative min-h-20 rounded-xl border border-accent/30 bg-accent/10 p-2 transition hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/20">
                    <p className="text-sm font-semibold text-white">{data.getDate()}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-accent">{e.titulo}{evs.length > 1 ? ` +${evs.length - 1}` : ""}</p>
                    <span className="absolute bottom-1.5 right-1.5 text-accent/80 transition group-hover:text-accent"><ArrowUpRight className="h-3.5 w-3.5" /></span>
                  </a>
                );
              }
              const isHoje = !fora && dk === hojeKey;
              return (
                <div key={dk} className={`min-h-20 rounded-xl border p-2 transition ${fora ? "border-white/5 bg-white/[0.01] text-white/20" : isHoje ? "border-accent/50 bg-accent/10 text-white ring-1 ring-accent/30" : "border-white/10 bg-white/[0.02] text-white/70"}`}>
                  <p className={`text-sm font-medium ${isHoje ? "font-bold text-accent" : ""}`}>{data.getDate()}{isHoje && <span className="ml-1 text-[9px] uppercase tracking-wide text-accent/80">hoje</span>}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista numerada cronológica */}
        {ordenados.length > 0 && (
          <div className="mt-8">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/70">Todos os eventos em ordem ({ordenados.length})</h4>
            <ol className="space-y-2">
              {ordenados.map((e, i) => (
                <li key={e.id}>
                  <a href={e.url_oficial} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-accent/40">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-white">{e.titulo}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
                        <span>📅 {fmt(e.data_inicio)}{e.data_fim && e.data_fim !== e.data_inicio ? ` – ${fmt(e.data_fim)}` : ""}</span>
                        {(e.cidade || e.local_nome) && <span>📍 {e.cidade || e.local_nome}{e.pais ? `, ${e.pais}` : ""}</span>}
                        {e.organizador && <span>· {e.organizador}</span>}
                        {e.modalidade && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${MOD_BADGE[e.modalidade] ?? "border-white/15 text-white/50"}`}>{e.modalidade}</span>}
                      </div>
                    </div>
                    <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent transition group-hover:gap-1.5">Acessar <ArrowUpRight className="h-3.5 w-3.5" /></span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
