"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";

// Wrapper declarado fora do render (evita recriar o componente a cada render).
// `embedded` controla se a seção tem largura/padding próprios ou não.
function Wrapper({ embedded, children }: { embedded?: boolean; children: ReactNode }) {
  return embedded ? (
    <section id="eventos" className="scroll-mt-32">{children}</section>
  ) : (
    <section id="eventos" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24">{children}</section>
  );
}

// Calendário ÚNICO de eventos: cursos/imersões do médico (link interno de inscrição)
// + congressos científicos (link externo oficial, pesquisados pela IA ou manuais).
// Calendário mensal + lista numerada cronológica com links.

export type EventoUnificado = {
  id: string;
  titulo: string;
  data_inicio: string;
  data_fim?: string | null;
  local?: string | null;
  pais?: string | null;
  modalidade?: string | null;
  badge?: string | null; // tipo do curso ou organizador do congresso
  href: string;
  external: boolean; // true = site oficial (nova aba); false = inscrição interna
  data_confirmada?: boolean; // false = data ainda provisória ("a confirmar")
  selo?: "proprio" | "parceiro" | null; // evento próprio/parceiro → destaque colorido
};

// Selo de evento próprio/parceiro: rótulo + cores (célula da grade e lista).
const SELO: Record<"proprio" | "parceiro", { label: string; cell: string; pill: string; num: string }> = {
  proprio: {
    label: "Evento próprio",
    cell: "border-amber-400/60 bg-amber-400/15 hover:border-amber-300 hover:bg-amber-400/25 text-amber-200",
    pill: "border-amber-400/50 bg-amber-400/15 text-amber-200",
    num: "bg-amber-400/25 text-amber-200",
  },
  parceiro: {
    label: "Parceiro",
    cell: "border-fuchsia-400/60 bg-fuchsia-400/15 hover:border-fuchsia-300 hover:bg-fuchsia-400/25 text-fuchsia-200",
    pill: "border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-200",
    num: "bg-fuchsia-400/25 text-fuchsia-200",
  },
};

// Mês/ano por extenso a partir de YYYY-MM-DD (p/ eventos com data a confirmar).
function fmtMes(iso: string) {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

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

export default function CalendarioCientifico({
  eventos,
  eyebrow = "Agenda de eventos",
  titulo = "Calendário de eventos",
  subtitulo = "Seus cursos/imersões e os congressos de anestesiologia, terapia intensiva e emergências (Brasil e mundo). Clique para acessar.",
  embedded = false,
}: {
  eventos: EventoUnificado[];
  eyebrow?: string;
  titulo?: string;
  subtitulo?: string;
  embedded?: boolean; // true = dentro de um hub (sem largura/padding própria de seção)
}) {
  const [mesAtual, setMesAtual] = useState(() => {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth(), 1);
  });
  const [hojeKey, setHojeKey] = useState("");
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHojeKey(key(new Date())), []);

  const porDia = useMemo(() => {
    const m: Record<string, EventoUnificado[]> = {};
    for (const e of eventos) {
      if (!e.data_inicio) continue;
      if (e.data_confirmada === false) continue; // sem dia exato → não fixa na grade
      (m[e.data_inicio] ??= []).push(e);
    }
    return m;
  }, [eventos]);

  const ordenados = useMemo(
    () => [...eventos].filter((e) => e.data_inicio).sort((a, b) => a.data_inicio.localeCompare(b.data_inicio)),
    [eventos]
  );

  // Lista abaixo do calendário = só os eventos do MÊS que está sendo visto (acompanha o ‹ ›).
  // Casa pelo mês de INÍCIO (mesma referência da grade). Quem quer outro mês, navega no calendário.
  const doMes = useMemo(() => {
    const y = mesAtual.getFullYear(), m = mesAtual.getMonth();
    return ordenados.filter((e) => {
      const d = new Date(`${e.data_inicio}T12:00:00`);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [ordenados, mesAtual]);

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
    <Wrapper embedded={embedded}>
      <div className={embedded ? "rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8" : "finex-glass rounded-[2rem] p-8 md:p-10"}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-accent-blue">{eyebrow}</p>
            <h3 className={embedded ? "mt-2 text-2xl font-medium tracking-tight md:text-3xl" : "mt-2 text-3xl font-medium tracking-tight md:text-4xl"}>{titulo}</h3>
            <p className="mt-2 text-sm text-muted">{subtitulo}</p>
          </div>
          <CalendarDays className="h-8 w-8 text-accent-blue" />
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
                const cor = e.selo
                  ? SELO[e.selo].cell
                  : e.external ? "border-accent/30 bg-accent/10 hover:border-accent/60 hover:bg-accent/20 text-accent" : "border-accent-blue/30 bg-accent-blue/10 hover:border-accent-blue/60 hover:bg-accent-blue/20 text-accent-blue";
                return (
                  <a key={dk} href={e.href} target={e.external ? "_blank" : undefined} rel={e.external ? "noopener noreferrer" : undefined} className={`group card-open relative min-h-20 rounded-xl border p-2 transition hover:-translate-y-0.5 ${cor}`}>
                    <p className="text-sm font-semibold text-white">{data.getDate()}{e.selo && <span className="ml-1">★</span>}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-tight">{e.titulo}{evs.length > 1 ? ` +${evs.length - 1}` : ""}</p>
                    <span className="absolute bottom-1.5 right-1.5 transition"><ArrowUpRight className="h-3.5 w-3.5" /></span>
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

        {/* Lista do MÊS visível (acompanha o calendário). Vazia → orienta a navegar. */}
        <div className="mt-8">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
            Eventos de {tituloMes} ({doMes.length})
          </h4>
          {doMes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/45">
              Nenhum evento em {tituloMes}. Use <span className="text-white/70">‹ Mês anterior</span> / <span className="text-white/70">Próximo mês ›</span> para ver outros meses.
            </p>
          ) : (
            <ol className="space-y-2">
              {doMes.map((e, i) => (
                <li key={e.id}>
                  <a href={e.href} target={e.external ? "_blank" : undefined} rel={e.external ? "noopener noreferrer" : undefined} className={`group flex items-start gap-3 rounded-xl border p-4 transition ${e.selo ? `${SELO[e.selo].pill} bg-opacity-[0.06]` : "border-white/10 bg-white/[0.03] hover:border-accent/40"}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${e.selo ? SELO[e.selo].num : "bg-accent/15 text-accent"}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {e.selo && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${SELO[e.selo].pill}`}>★ {SELO[e.selo].label}</span>}
                        <p className="text-sm font-semibold leading-snug text-white">{e.titulo}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
                        {e.data_confirmada === false ? (
                          <span className="inline-flex items-center gap-1">📅 {fmtMes(e.data_inicio)} <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-300">data a confirmar</span></span>
                        ) : (
                          <span>📅 {fmt(e.data_inicio)}{e.data_fim && e.data_fim !== e.data_inicio ? ` – ${fmt(e.data_fim)}` : ""}</span>
                        )}
                        {e.local && <span>📍 {e.local}{e.pais ? `, ${e.pais}` : ""}</span>}
                        {e.badge && <span>· {e.badge}</span>}
                        {e.modalidade && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${MOD_BADGE[e.modalidade] ?? "border-white/15 text-white/50"}`}>{e.modalidade}</span>}
                        {!e.external && <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-blue">inscrição</span>}
                      </div>
                    </div>
                    <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent transition group-hover:gap-1.5">{e.external ? "Acessar" : "Inscrição"} <ArrowUpRight className="h-3.5 w-3.5" /></span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
