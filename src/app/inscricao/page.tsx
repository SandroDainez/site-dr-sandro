import { CalendarCheck2, CircleDollarSign, Stethoscope } from "lucide-react";

type InscricaoPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const eventosMap: Record<string, { titulo: string; descricao: string; investimento: string }> = {
  "manejo-via-aerea-critico": {
    titulo: "Manejo de via aérea no paciente crítico",
    descricao: "Treinamento com foco em preparação, escolha de estratégia e execução segura no cenário crítico.",
    investimento: "R$ 890,00",
  },
  "via-aerea-dificil-no-critico": {
    titulo: "Via aérea difícil no crítico",
    descricao: "Imersão prática em predição, dispositivos de resgate e algoritmo para falha de intubação.",
    investimento: "R$ 990,00",
  },
  "acls-guiado-por-voz": {
    titulo: "ACLS guiado por voz na prática",
    descricao: "Atualização prática em PCR intra-hospitalar com simulação de comando e coordenação de equipe.",
    investimento: "R$ 790,00",
  },
  "emergencias-medicas-plantao": {
    titulo: "Emergências médicas no plantão",
    descricao: "Abordagem dos principais cenários críticos com tomada de decisão rápida e estruturada.",
    investimento: "R$ 840,00",
  },
};

const eventoFallback = {
  titulo: "Evento médico",
  descricao: "Inscrição para atualização em anestesiologia, terapia intensiva e medicina de urgência.",
  investimento: "Sob consulta",
};

export default async function InscricaoPage({ searchParams }: InscricaoPageProps) {
  const params = await searchParams;
  const eventoSlugRaw = params.evento;
  const dataRaw = params.data;

  const eventoSlug = Array.isArray(eventoSlugRaw) ? eventoSlugRaw[0] : eventoSlugRaw;
  const dataEvento = Array.isArray(dataRaw) ? dataRaw[0] : dataRaw;

  const evento =
    typeof eventoSlug === "string" && eventoSlug.length > 0
      ? (eventosMap[eventoSlug] ?? eventoFallback)
      : eventoFallback;

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-panel p-8 shadow-2xl md:p-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-accent">
          <Stethoscope className="h-3.5 w-3.5" /> Inscrição de evento
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{evento.titulo}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">{evento.descricao}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-accent-blue">
              <CalendarCheck2 className="h-4 w-4" /> Data do evento
            </p>
            <p className="text-base font-semibold text-white">
              {dataEvento
                ? new Date(`${dataEvento}T12:00:00`).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "A definir"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-accent-violet">
              <CircleDollarSign className="h-4 w-4" /> Investimento
            </p>
            <p className="text-base font-semibold text-white">{evento.investimento}</p>
          </div>
        </div>

        <form className="mt-8 space-y-4">
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
      </section>
    </main>
  );
}
