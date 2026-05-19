import {
  ArrowRight,
  AudioLines,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  FileText,
  GraduationCap,
  HeartPulse,
  Layers,
  Microscope,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import Image from "next/image";
import CalendarioEventos from "@/components/CalendarioEventos";

const assinaturaApps = [
  {
    title: "AnesMap",
    subtitle: "Preparação estruturada para residência, especialização e título",
    text: "Banco de questões, flashcards SM-2 e protocolos por área, com foco em retenção e tomada de decisão.",
    icon: Layers,
    glow: "from-emerald-400/30 to-emerald-600/5",
    highlights: ["Questões comentadas por tema", "Revisão espaçada com SM-2"],
  },
  {
    title: "MedEscala",
    subtitle: "Organização de plantões e equipe médica",
    text: "Escalas com previsibilidade, registro de trocas e visão operacional da cobertura assistencial.",
    icon: CalendarClock,
    glow: "from-blue-400/30 to-blue-600/5",
    highlights: ["Distribuição mais equilibrada", "Visão da cobertura por equipe"],
  },
  {
    title: "Ficha de Anestesia",
    subtitle: "Registro digital intraoperatório",
    text: "Registro padronizado do pré, intra e pós-operatório, incluindo avaliação pré-anestésica e sala de recuperação anestésica.",
    icon: FileText,
    glow: "from-violet-400/30 to-violet-600/5",
    highlights: ["Pré, intra e pós-operatório", "SRPA e avaliação pré-anestésica"],
  },
  {
    title: "Emergências Médicas",
    subtitle: "Resposta inicial em cenários críticos",
    text: "Algoritmos rápidos, doses e condutas críticas para plantão.",
    icon: Zap,
    glow: "from-cyan-400/30 to-cyan-600/5",
    highlights: ["Acesso rápido em cenário crítico", "Condutas com foco em tempo-resposta"],
  },
  {
    title: "ACLS Guiado",
    subtitle: "Roteiro prático para PCR intra-hospitalar guiado por voz",
    text: "Cronometria de ciclos, condutas e checkpoints para alinhamento da equipe de reanimação.",
    icon: HeartPulse,
    glow: "from-amber-400/30 to-amber-600/5",
    highlights: ["Comandos guiados por voz", "Sequência prática para equipe"],
  },
];

const acessoAbertoCards = [
  {
    title: "Aplicativos gratuitos",
    desc: "Ferramentas abertas para consulta rápida e suporte à conduta no plantão.",
    icon: BookOpen,
  },
  {
    title: "Aulas e podcasts gratuitos",
    desc: "Conteúdo aberto para atualização objetiva, sem necessidade de login.",
    icon: AudioLines,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_8%_0%,rgba(44,230,184,0.22),transparent_60%),radial-gradient(60%_40%_at_95%_0%,rgba(95,143,255,0.22),transparent_62%),linear-gradient(180deg,#07090f_0%,#0a1020_55%,#07090f_100%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="rain-overlay absolute inset-0" />
        <div className="rain-overlay-soft absolute inset-0" />
      </div>

      <header className="sticky top-0 z-50 border-b border-line/70 bg-background/65 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-6 py-4 lg:flex-row lg:justify-between lg:gap-0">
          <div className="flex items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-black/10 shadow-[0_0_34px_rgba(44,230,184,0.32)]">
              <Image
                src="/logo-medicina.png"
                alt="Logo medicina"
                width={80}
                height={80}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div className="text-center lg:text-left">
              <p className="text-2xl font-bold tracking-tight text-white md:text-3xl">Dr. Sandro Dainez</p>
              <div className="mt-1 space-y-0.5 text-sm font-semibold leading-tight tracking-tight text-accent md:text-base">
                <p>CREMESP 76.907</p>
                <p>Anestesiologia RQE 58.201</p>
                <p>Medicina Intensiva RQE 58.202</p>
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-3 rounded-full border border-white/10 bg-black/75 px-3 py-2 text-sm text-white/70 backdrop-blur-md lg:flex">
            <a href="#apps-assinatura" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Apps Assinatura
            </a>
            <a href="#apps-gratis" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Apps Grátis
            </a>
            <a href="#cursos" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Cursos
            </a>
            <a href="#conteudo" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Podcasts e Aulas
            </a>
            <a href="#eventos" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Eventos
            </a>
            <a href="#contato" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Contato
            </a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href="#via-aerea-dificil"
              className="finex-beam finex-beam-strong finex-glow-breathe rounded-full px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white"
            >
              Via aérea difícil
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:pt-20">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0C] p-6 shadow-2xl">
            <div className="finex-aura-mask pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_25%_0%,rgba(44,230,184,0.18),transparent_65%),radial-gradient(45%_35%_at_80%_0%,rgba(59,130,246,0.22),transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.08),rgba(255,255,255,0.08)_1px,transparent_1px,transparent_10px)]" />

            <div className="relative mb-6 flex items-center justify-between rounded-full border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-md">
              <div className="inline-flex h-10 w-10" />
              <div className="hidden items-center gap-6 text-xs uppercase tracking-[0.14em] text-white/65 md:flex">
                <span>Apps</span>
                <span>Cursos</span>
                <span>Protocolos</span>
                <span>Podcasts</span>
              </div>
              <a
                href="#apps-assinatura"
                className="finex-beam finex-beam-strong rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
              >
                Ver oferta
              </a>
            </div>

            <div>
              <div className="finex-glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-accent">
                <Sparkles className="h-3.5 w-3.5" /> Conteúdo técnico e prática clínica
              </div>
              <h1 className="max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.03em] md:text-6xl lg:text-7xl">
                Atualização médica digital com alto padrão
              </h1>
              <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
                Plataforma de apoio à decisão em medicina de urgência e emergência, terapia
                intensiva e anestesiologia.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="#apps-assinatura"
                  className="finex-beam finex-beam-strong inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.9)] transition"
                >
                  Explorar plataforma <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#conteudo"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                >
                  Ver conteúdo aberto
                </a>
              </div>
            </div>

            <div className="pointer-events-none absolute right-4 bottom-[16%] hidden rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-accent lg:block finex-chip">
              Segurança
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35 py-3">
            <div className="finex-marquee-track flex items-center gap-3 px-4">
              {[
                "Protocolos revisados semanalmente",
                "Ferramentas para decisão à beira-leito",
                "Conteúdo aberto sem login",
                "Cursos presenciais, híbridos e online",
                "Atualização científica contínua",
                "Material orientado à prática assistencial",
                "Protocolos revisados semanalmente",
                "Ferramentas para decisão à beira-leito",
                "Conteúdo aberto sem login",
                "Cursos presenciais, híbridos e online",
                "Atualização científica contínua",
                "Material orientado à prática assistencial",
              ].map((item, idx) => (
                <span
                  key={`${item}-${idx}`}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1 text-xs uppercase tracking-[0.14em] text-white/70"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="apps-assinatura" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.16em] text-accent">Aplicativos por assinatura</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-5xl">
              Apps médicos e protocolos para decisão clínica
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {assinaturaApps.map((app, idx) => (
              <article
                key={app.title}
                className={`group finex-scan card-open relative overflow-hidden rounded-3xl border border-white/10 bg-panel p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20 ${idx === assinaturaApps.length - 1 ? "md:col-span-2 xl:col-span-1" : ""}`}
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${app.glow}`} />
                <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:bg-white/20" />
                <div className="pointer-events-none absolute bottom-0 left-1/2 h-20 w-2/3 -translate-x-1/2 rounded-full bg-accent-blue/20 blur-2xl opacity-0 transition duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                      <app.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                      Assinatura
                    </span>
                  </div>
                  <h3 className="text-2xl font-medium tracking-tight">{app.title}</h3>
                  <p className="mt-1 text-sm text-accent-blue">{app.subtitle}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{app.text}</p>
                  <div className="card-open-content mt-0 space-y-1.5">
                    {app.highlights.map((highlight) => (
                      <div key={highlight} className="flex items-center gap-2 text-xs text-white/80">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition group-hover:scale-[1.02] group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(95,143,255,0.35)]">
                    Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="apps-gratis" className="scroll-mt-32 mx-auto grid w-full max-w-7xl gap-6 px-6 pb-24 lg:grid-cols-2">
          <div className="finex-glass rounded-3xl p-8">
            <p className="text-xs uppercase tracking-[0.16em] text-accent">Aplicativos gratuitos</p>
            <h3 className="mt-3 text-3xl font-medium tracking-tight">Acesso aberto imediato</h3>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {acessoAbertoCards.map((item) => (
                <div key={item.title} className="card-open rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-accent/35 hover:bg-black/30">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-accent" />
                    <p className="font-medium">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="conteudo" className="scroll-mt-32 rounded-3xl border border-white/10 bg-panel p-8">
            <p className="text-xs uppercase tracking-[0.16em] text-accent-blue">Conteúdo educacional aberto</p>
            <h3 className="mt-3 text-3xl font-medium tracking-tight">Podcasts, aulas e atualizações</h3>
            <div className="mt-7 grid gap-4">
              {[
                { title: "Aulas abertas", subtitle: "Acesso livre para revisão rápida", icon: PlayCircle },
                { title: "Podcasts clínicos", subtitle: "Discussão de casos e condutas", icon: AudioLines },
                { title: "Atualizações semanais", subtitle: "Evidência recente aplicada", icon: Microscope },
                { title: "Protocolos guiados", subtitle: "Fluxos de conduta passo a passo", icon: BrainCircuit },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group finex-scan flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-accent-blue/35 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-accent-blue" />
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/45 transition group-hover:translate-x-1 group-hover:text-white" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cursos" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24">
          <div className="finex-glass rounded-[2rem] p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-accent-violet">Cursos presenciais, híbridos e online</p>
                <h3 className="mt-3 text-3xl font-medium tracking-tight md:text-5xl">
                  Atualização médica contínua
                </h3>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: "manejo-via-aerea",
                    title: "Manejo de via aérea no paciente crítico",
                  },
                  {
                    id: "via-aerea-dificil",
                    title: "Via aérea difícil no crítico",
                  },
                ].map((topic) => (
                  <div
                    id={topic.id}
                    key={topic.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-accent-violet/35 hover:bg-black/30"
                  >
                    <GraduationCap className="h-4 w-4 text-accent-violet" />
                    <p className="text-sm text-white/85">{topic.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <CalendarioEventos />

        <section id="contato" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24">
          <div className="finex-glass rounded-[2rem] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.16em] text-accent">Contato</p>
            <h3 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
              Canais para inscrição e suporte
            </h3>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {[
                {
                  label: "E-mail",
                  value: "contato@drsandro.com.br",
                  href: "mailto:contato@drsandro.com.br",
                },
                {
                  label: "WhatsApp",
                  value: "+55 (11) 99999-9999",
                  href: "https://wa.me/5511999999999",
                },
                {
                  label: "Telefone",
                  value: "+55 (11) 4000-0000",
                  href: "tel:+551140000000",
                },
                {
                  label: "Outros",
                  value: "Instagram e Telegram",
                  href: "https://instagram.com/",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-accent/35 hover:bg-black/30"
                >
                  <p className="text-xs uppercase tracking-[0.12em] text-accent-blue">{item.label}</p>
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                    className="mt-2 inline-block text-base font-medium text-white underline decoration-white/30 underline-offset-4 transition hover:text-accent hover:decoration-accent"
                  >
                    {item.value}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Segurança clínica",
                text: "Condutas estruturadas para reduzir variabilidade assistencial.",
              },
              {
                icon: BrainCircuit,
                title: "Decisão baseada em evidência",
                text: "Síntese objetiva da literatura para suporte à conduta.",
              },
              {
                icon: Sparkles,
                title: "Usabilidade orientada ao plantão",
                text: "Acesso rápido à informação crítica em momentos de decisão.",
              },
            ].map((item) => (
              <article key={item.title} className="group rounded-3xl border border-white/10 bg-[#10141d] p-6 transition hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_22px_45px_-28px_rgba(44,230,184,0.45)]">
                <item.icon className="h-5 w-5 text-accent" />
                <h4 className="mt-4 text-xl font-medium tracking-tight">{item.title}</h4>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line/80 bg-black/20 py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted sm:flex-row">
          <p>Dr. Sandro • Portal de Anestesiologia e Medicina Intensiva</p>
          <p>© 2026 Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
