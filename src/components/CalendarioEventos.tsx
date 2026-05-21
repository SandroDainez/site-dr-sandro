"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type EventoCalendario = {
  titulo: string;
  slug: string;
};

const eventos: Record<string, EventoCalendario> = {
  "2026-05-24": { titulo: "Manejo de via aérea no paciente crítico", slug: "manejo-via-aerea-critico" },
  "2026-05-28": { titulo: "Via aérea difícil no crítico", slug: "via-aerea-dificil-no-critico" },
  "2026-06-03": { titulo: "ACLS guiado por voz na prática", slug: "acls-guiado-por-voz" },
  "2026-06-11": { titulo: "Emergências médicas no plantão", slug: "emergencias-medicas-plantao" },
};

const semana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarioEventos() {
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });

  // Calculado via useEffect para evitar hydration mismatch no SSR do Next.js
  const [hojeKey, setHojeKey] = useState<string>("");
  useEffect(() => {
    setHojeKey(getDateKey(new Date()));
  }, []);

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
              const evento = eventos[dateKey];

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
      </div>
    </section>
  );
}
