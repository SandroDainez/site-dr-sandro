import { createPublicClient, supabaseConfigured } from "@/lib/supabase/server";
import type { Especialidade } from "@/types/medical";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";
import { dataCurta } from "@/lib/format-date";

// Congressos/eventos científicos mundiais (descobertos pelos agentes, no Supabase).
// Separado do "Calendário de aulas e imersões" do médico. Some se não houver dados.

const MODALIDADE_BADGE: Record<string, string> = {
  presencial: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  online: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  hibrido: "border-violet-400/30 bg-violet-400/10 text-violet-300",
};

const fmt = dataCurta;

interface EventoRow {
  id: string | number;
  url_oficial: string;
  titulo: string;
  descricao?: string | null;
  modalidade?: string | null;
  pais?: string | null;
  data_inicio: string;
  data_fim?: string | null;
  cidade?: string | null;
  local_nome?: string | null;
}

export default async function EventosCientificos({
  especialidade,
  limit = 6,
  accent = "text-accent",
  titulo,
}: {
  especialidade?: Especialidade;
  limit?: number;
  accent?: string;
  titulo?: string;
}) {
  if (!supabaseConfigured()) return null;

  let eventos: EventoRow[] = [];
  try {
    const supabase = createPublicClient();
    const hoje = new Date().toISOString().split("T")[0];
    let query = supabase
      .from("medical_events")
      .select("*")
      .eq("ativo", true)
      .gte("data_inicio", hoje)
      .order("data_inicio", { ascending: true })
      .limit(limit);
    if (especialidade) query = query.contains("especialidades", [especialidade]);
    const { data } = await query;
    eventos = (data ?? []) as EventoRow[];
  } catch {
    return null;
  }

  if (eventos.length === 0) return null;

  return (
    <section className="mb-10">
      {titulo && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <CalendarDays className={`h-5 w-5 ${accent}`} /> {titulo}
          </h2>
          <span className="text-xs text-white/35">agenda automática</span>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
      {eventos.map((ev) => (
        <a
          key={ev.id}
          href={ev.url_oficial}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {ev.modalidade && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${MODALIDADE_BADGE[ev.modalidade] ?? "border-white/15 text-white/50"}`}>
                {ev.modalidade}
              </span>
            )}
            {ev.pais && <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/50">{ev.pais}</span>}
          </div>
          <p className="text-sm font-semibold leading-snug text-white">{ev.titulo}</p>
          {ev.descricao && <p className="mt-1 line-clamp-2 text-xs text-white/50">{ev.descricao}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {fmt(ev.data_inicio)}{ev.data_fim && ev.data_fim !== ev.data_inicio ? ` – ${fmt(ev.data_fim)}` : ""}
            </span>
            {(ev.cidade || ev.local_nome) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {ev.cidade || ev.local_nome}
              </span>
            )}
          </div>
          <span className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${accent} transition group-hover:gap-1.5`}>
            Site oficial <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </a>
      ))}
      </div>
    </section>
  );
}
