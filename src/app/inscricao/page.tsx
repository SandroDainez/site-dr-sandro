import {
  CalendarCheck2,
  CircleDollarSign,
  Stethoscope,
  Clock,
  MapPin,
  Timer,
  Users,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { getEventos, type EventoData } from "@/lib/content";

export const dynamic = "force-dynamic";

type InscricaoPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const eventoFallback: EventoData = {
  slug: "",
  titulo: "Evento médico",
  descricao:
    "Inscrição para atualização em anestesiologia, terapia intensiva e medicina de urgência.",
  investimento: "Sob consulta",
  data: "",
};

function formatarData(iso: string): string {
  if (!iso) return "A definir";
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function InscricaoPage({ searchParams }: InscricaoPageProps) {
  const [params, eventos] = await Promise.all([searchParams, getEventos()]);

  const eventoSlugRaw = params.evento;
  const dataRaw = params.data;
  const eventoSlug = Array.isArray(eventoSlugRaw) ? eventoSlugRaw[0] : eventoSlugRaw;
  const dataParam = Array.isArray(dataRaw) ? dataRaw[0] : dataRaw;

  const eventoData =
    typeof eventoSlug === "string" && eventoSlug.length > 0
      ? eventos.find((e) => e.slug === eventoSlug) ?? eventoFallback
      : eventoFallback;

  const dataEvento = eventoData.data || dataParam || "";
  const programacaoItens = (eventoData.programacao ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const infoCards = [
    eventoData.tipo && { icon: Stethoscope, label: "Tipo", value: eventoData.tipo, color: "text-accent" },
    { icon: CalendarCheck2, label: "Data", value: formatarData(dataEvento), color: "text-accent-blue" },
    eventoData.horario && { icon: Clock, label: "Horário", value: eventoData.horario, color: "text-accent-blue" },
    eventoData.local && { icon: MapPin, label: "Local", value: eventoData.local, color: "text-accent" },
    eventoData.cargaHoraria && { icon: Timer, label: "Carga horária", value: eventoData.cargaHoraria, color: "text-accent-blue" },
    { icon: CircleDollarSign, label: "Investimento", value: eventoData.investimento || "Sob consulta", color: "text-accent-violet" },
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string; color: string }[];

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/#eventos"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para a agenda
        </Link>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-2xl">
          {/* Folder / cartaz */}
          {eventoData.folderUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={eventoData.folderUrl}
              alt={eventoData.titulo}
              className="max-h-80 w-full object-cover"
            />
          )}

          <div className="p-8 md:p-10">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-accent">
                <Stethoscope className="h-3.5 w-3.5" /> Inscrição de evento
              </span>
              {eventoData.tipo && (
                <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent-blue">
                  {eventoData.tipo}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{eventoData.titulo}</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">{eventoData.descricao}</p>

            {/* Informações do evento */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {infoCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className={`mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] ${card.color}`}>
                    <card.icon className="h-4 w-4" /> {card.label}
                  </p>
                  <p className="text-base font-semibold text-white">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Público-alvo */}
            {eventoData.publicoAlvo && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-accent">
                  <Users className="h-4 w-4" /> Público-alvo
                </p>
                <p className="text-sm font-medium text-white/85">{eventoData.publicoAlvo}</p>
              </div>
            )}

            {/* Programação */}
            {programacaoItens.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold tracking-tight text-white">Programação</h2>
                <ul className="mt-4 space-y-2.5">
                  {programacaoItens.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/80">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Inscrição */}
            <div className="mt-10 rounded-2xl border border-white/10 bg-black/20 p-6">
              <h2 className="text-lg font-semibold tracking-tight text-white">Inscrição</h2>
              {eventoData.inscricaoUrl ? (
                <>
                  <p className="mt-2 text-sm text-muted">
                    As inscrições são feitas na plataforma oficial do evento.
                  </p>
                  <a
                    href={eventoData.inscricaoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="finex-beam finex-beam-strong mt-5 inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white"
                  >
                    Fazer inscrição →
                  </a>
                </>
              ) : (
                <form className="mt-4 space-y-4">
                  <p className="text-sm text-muted">
                    Preencha seus dados e entraremos em contato com as instruções.
                  </p>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-accent-blue/45"
                  />
                  <input
                    type="email"
                    placeholder="E-mail"
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-accent-blue/45"
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp"
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-accent-blue/45"
                  />
                  <button
                    type="button"
                    className="finex-beam finex-beam-strong w-full rounded-2xl px-6 py-3 text-sm font-semibold text-white"
                  >
                    Confirmar interesse
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
