"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { EventoData } from "@/lib/content";

type Props = {
  eventos: EventoData[];
};

const semana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarioEventos({ eventos }: Props) {
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });

  const [hojeKey, setHojeKey] = useState<string>("");
  useEffect(() => {
    setHojeKey(getDateKey(new Date()));
  }, []);

  const eventosMap = useMemo(() => {
    const map: Record<string, EventoData> = {};
    for (const e of eventos) {
      map[e.data] = e;
    }
    return map;
  }, [eventos]);

  const eventosOrdenados = useMemo(
    () =>
      [...eventos]
        .filter((e) => e.data)
        .sort((a, b) => a.data.localeCompare(b.data)),
    [eventos]
  );

  const { dias, tituloMes } = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();

    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diaInicialSemana = primeiroDia.getDay();
    const totalDias = ultimoDia.getDate();

    const diasGrid: Array<{ data: Date; foraDoMes: boolean }> = [];

    for (let i = 0; i < diaInicialSemana; i += 1) {
      diasGrid.push({
        data: new Date(ano, mes, i - diaInicialSemana + 1),
        foraDoMes: true,
      });
    }

    for (let dia = 1; dia <= totalDias; dia += 1) {
      diasGrid.push({
        data: new Date(ano, mes, dia),
        foraDoMes: false,
      });
    }

    const faltantes = (7 - (diasGrid.length % 7)) % 7;
    for (let i = 1; i <= faltantes; i += 1) {
      diasGrid.push({
        data: new Date(ano, mes + 1, i),
        foraDoMes: true,
      });
    }

    const titulo = mesAtual.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    return { dias: diasGrid, tituloMes: titulo };
  }, [mesAtual]);

  return (
    <section id="eventos" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24">
      <div className="finex-glass rounded-[2rem] p-8 md:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-accent-blue">Agenda de eventos</p>
            <h3 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
              Calendário de aulas e imersões
            </h3>
            <p className="mt-2 text-sm text-muted">
              Clique nas datas com destaque para acessar a página de inscrição.
            </p>
          </div>
          <CalendarDays className="h-8 w-8 text-accent-blue" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMesAtual((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" /> Mês anterior
            </button>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/85">{tituloMes}</p>
            <button
              type="button"
              onClick={() => setMesAtual((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
            >
              Próximo mês <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2">
            {semana.map((dia) => (
              <div
                key={dia}
                className="rounded-xl border border-white/10 bg-white/[0.03] py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white/60"
              >
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {dias.map(({ data, foraDoMes }) => {
              const dateKey = getDateKey(data);
              const evento = eventosMap[dateKey];

              if (evento && !foraDoMes) {
                return (
                  <Link
                    key={dateKey}
                    href={`/inscricao?evento=${evento.slug}&data=${dateKey}`}
                    className="group card-open relative min-h-20 rounded-xl border border-accent-blue/30 bg-accent-blue/10 p-2 transition hover:-translate-y-0.5 hover:border-accent-blue/60 hover:bg-accent-blue/20"
                  >
                    <p className="text-sm font-semibold text-white">{data.getDate()}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-accent-blue">
                      {evento.titulo}
                    </p>
                    <span className="absolute bottom-2 right-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/75 transition group-hover:text-white">
                      Inscrição
                    </span>
                  </Link>
                );
              }

              const isHoje = !foraDoMes && dateKey === hojeKey;
              return (
                <div
                  key={dateKey}
                  className={`min-h-20 rounded-xl border p-2 transition ${
                    foraDoMes
                      ? "border-white/5 bg-white/[0.01] text-white/20"
                      : isHoje
                      ? "border-accent/50 bg-accent/10 text-white ring-1 ring-accent/30"
                      : "border-white/10 bg-white/[0.02] text-white/70"
                  }`}
                >
                  <p className={`text-sm font-medium ${isHoje ? "font-bold text-accent" : ""}`}>
                    {data.getDate()}
                    {isHoje && (
                      <span className="ml-1 text-[9px] uppercase tracking-wide text-accent/80">
                        hoje
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista de eventos com detalhes */}
        {eventosOrdenados.length > 0 && (
          <div className="mt-8">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
              Próximos eventos
            </h4>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {eventosOrdenados.map((evento) => {
                const dataFmt = (() => {
                  try {
                    return new Date(`${evento.data}T12:00:00`).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                  } catch {
                    return evento.data;
                  }
                })();
                return (
                  <Link
                    key={evento.slug || evento.data}
                    href={`/inscricao?evento=${evento.slug}&data=${evento.data}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-accent-blue/40"
                  >
                    {evento.folderUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" decoding="async"
                        src={evento.folderUrl}
                        alt={evento.titulo}
                        className="h-36 w-full object-cover"
                      />
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {evento.tipo && (
                          <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent-blue">
                            {evento.tipo}
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-white/45">{dataFmt}</span>
                      </div>
                      <p className="text-[15px] font-semibold leading-snug text-white">{evento.titulo}</p>
                      {evento.descricao && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                          {evento.descricao}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/55">
                        {evento.horario && <span>🕐 {evento.horario}</span>}
                        {evento.local && <span>📍 {evento.local}</span>}
                        {evento.investimento && <span>💳 {evento.investimento}</span>}
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-accent-blue transition group-hover:gap-2">
                        Ver detalhes e inscrição →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
