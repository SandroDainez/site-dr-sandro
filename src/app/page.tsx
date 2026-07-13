export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  FileText,
  GraduationCap,
  HeartPulse,
  Layers,
  ListChecks,
  Microscope,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import AgendaCientifica from "@/components/AgendaCientifica";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import ZonasEntrada from "@/components/zonas/ZonasEntrada";
import AssistenteButton from "@/components/AssistenteButton";
import AtualizacoesFeed from "@/components/AtualizacoesFeed";
import { fetchMedicalUpdates } from "@/lib/supabase/server";
import HomeVideoCard from "@/components/HomeVideoCard";
import PodcastList from "@/app/podcast/PodcastList";
import SiteFooter from "@/components/SiteFooter";
import ColaboradoresList from "@/app/colaboradores/ColaboradoresList";
import AcervoList from "@/app/acervo/AcervoList";
import ProtocoloCard from "@/components/ProtocoloCard";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import MobileNav from "@/components/MobileNav";
import { buildTypographyCss } from "@/lib/typography-sections";
import { secText } from "@/lib/section-texts";
import { uiText } from "@/lib/ui-texts";
import AppsUnificados from "@/components/AppsUnificados";
import {
  getAplicativos,
  getContato,
  getEventos,
  getHero,
  getHeader,
  getCourses,
  getWhyUs,
  getSiteConfig,
  getAtualizacoes,
  getEspecialidades,
  getProtocolos,
  getVideoaulas,
  getPodcasts,
  getColaboradores,
  getAcervo,
  getProcedimentos,
  getSectionTexts,
  getUiTexts,
  getTypography,
  getNavItems,
  getNavStyle,
  getHomeOrder,
  getHomeHidden,
  getCardCols,
  headerSubtitleLines,
} from "@/lib/content";
import { getProtocolosPublicadosData } from "@/lib/protocolos-editora";
import { colStyle } from "@/lib/card-grid";
import { corTema } from "@/lib/especialidade-cor";

const iconMap: Record<string, LucideIcon> = {
  Layers, CalendarClock, FileText, Zap, HeartPulse, BookOpen, AudioLines,
  BrainCircuit, ShieldCheck, Sparkles, GraduationCap, Microscope,
  Wallet, PiggyBank, ListChecks,
};


// A ordem das seções da home vem de getHomeOrder() (editável em /admin/ordem-home).
function computeHomeOrder(list: string[]): Record<string, number> {
  const order: Record<string, number> = {};
  list.forEach((id, i) => { order[id] = (i + 1) * 100; });
  return order;
}

export default async function Home() {
  const [eventos, aplicativos, contato, hero, header, courses, whyUs, siteConfig, atualizacoes, protocolosBlob, videoaulas, podcasts, colaboradores, acervo, procedimentos, st, ui, typo, navItems, navStyle, homeOrderList, cardCols, especialidades, protocolosEditoraData, homeHidden] = await Promise.all([
    getEventos(),
    getAplicativos(),
    getContato(),
    getHero(),
    getHeader(),
    getCourses(),
    getWhyUs(),
    getSiteConfig(),
    getAtualizacoes(),
    getProtocolos(),
    getVideoaulas(),
    getPodcasts(),
    getColaboradores(),
    getAcervo(),
    getProcedimentos(),
    getSectionTexts(),
    getUiTexts(),
    getTypography(),
    getNavItems(),
    getNavStyle(),
    getHomeOrder(),
    getCardCols(),
    getEspecialidades(),
    getProtocolosPublicadosData(),
    getHomeHidden(),
  ]);
  const homeOrder = computeHomeOrder(homeOrderList);
  // Estilo de cada seção: se está oculta (editável no admin /ordem-home), some da home;
  // senão, posiciona pela ordem.
  const ocultas = new Set(homeHidden);
  const secStyle = (id: string): React.CSSProperties =>
    ocultas.has(id) ? { display: "none" } : { order: homeOrder[id] };
  // Lista ÚNICA de protocolos: Editora (card padrão) + "de blob".
  const protocolos = [...protocolosEditoraData, ...protocolosBlob];
  // Logo por área (p/ reaproveitar nos cards de Atualizações) — chave em forma "site"
  // (emergencias | ti | anestesiologia), igual ao AtualizacoesFeed.
  const espLogos: Record<string, { logoUrl?: string; emoji?: string }> = {};
  for (const e of especialidades) {
    if (e.area) espLogos[e.area] = { logoUrl: e.logoUrl, emoji: e.emoji };
  }
  const aiBoletins = await fetchMedicalUpdates();
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Tipografia por seção definida no admin (tamanho, fonte, cor, peso) */}
      <style dangerouslySetInnerHTML={{ __html: buildTypographyCss(typo) }} />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_8%_0%,rgba(44,230,184,0.22),transparent_60%),radial-gradient(60%_40%_at_95%_0%,rgba(95,143,255,0.22),transparent_62%),linear-gradient(180deg,#0f1420_0%,#0a1020_55%,#0f1420_100%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="rain-overlay absolute inset-0" />
        <div className="rain-overlay-soft absolute inset-0" />
      </div>

      <header className="sticky top-0 z-50 border-b border-line/70 bg-background/65 backdrop-blur-xl" data-typo="header">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-6 py-4 lg:flex-row lg:justify-between lg:gap-0">
          <div className="flex items-center gap-4 md:gap-5">
            <SiteLogo header={header} variant="lg" />
            <div className="max-w-md text-center lg:text-left">
              {header.name && (
                <p className="text-2xl font-bold leading-tight tracking-tight text-white break-words md:text-3xl">{header.name}</p>
              )}
              {headerSubtitleLines(header).length > 0 && (
                <div className="mt-2 space-y-0.5 text-base font-semibold leading-tight tracking-tight text-accent md:text-lg lg:text-xl">
                  {headerSubtitleLines(header).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SiteNav items={navItems} style={navStyle} />
            <AssistenteButton /><SearchButton /><AuthButton />
          </div>

          <MobileNav items={navItems} style={navStyle} />
        </div>
      </header>

      <main className="flex flex-col">
        <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-4 md:pt-8" data-typo="hero" style={{ order: -200 }}>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0C] p-6 shadow-2xl">
            <div className="finex-aura-mask pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_25%_0%,rgba(44,230,184,0.18),transparent_65%),radial-gradient(45%_35%_at_80%_0%,rgba(59,130,246,0.22),transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.08),rgba(255,255,255,0.08)_1px,transparent_1px,transparent_10px)]" />

            <div>
              <div className="finex-glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-accent">
                <Sparkles className="h-3.5 w-3.5" /> {hero.badge}
              </div>
              <h1 className="max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.03em] md:text-6xl lg:text-7xl">
                {hero.title}
              </h1>
              <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
                {hero.subtitle}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="#especialidades"
                  className="inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
                >
                  {uiText(ui, "heroCtaPrimary")} <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#eventos"
                  className="inline-flex items-center gap-2 rounded-2xl border border-accent/55 bg-accent/[0.08] px-6 py-3 text-sm font-semibold text-accent transition hover:border-accent/80 hover:bg-accent/15"
                >
                  {uiText(ui, "heroCtaSecondary")}
                </a>
              </div>
            </div>

            <div className="pointer-events-none absolute right-4 bottom-[16%] hidden rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-accent lg:block finex-chip">
              {uiText(ui, "heroChip")}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20" style={{ order: -150 }}>
          <ZonasEntrada />
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20" data-typo="marquee" style={{ order: -100 }}>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35 py-3">
            <div className="finex-marquee-track flex items-center gap-3 px-4">
              {[...siteConfig.marqueeItems, ...siteConfig.marqueeItems].map((item, idx) => (
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

        {/* Navegue por especialidade — hubs */}
        <section id="especialidades" className="scroll-mt-24 mx-auto w-full max-w-7xl px-6 pb-20" style={{ order: -90 }}>
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "especialidades_band", "eyebrow")}</p>
            <h2 className="mt-1 text-2xl font-medium tracking-tight md:text-3xl">{secText(st, "especialidades_band", "title")}</h2>
          </div>
          <div className="card-grid gap-4" style={colStyle(cardCols["especialidades"] ?? 3)}>
            {especialidades.map((s) => {
              const tema = corTema(s.cor);
              return (
                <a key={s.id} href={s.href || "/"} className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-panel p-7 transition hover:-translate-y-1 ${tema.border}`}>
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tema.grad} to-transparent`} />
                  {!s.logoUrl && <div className="pointer-events-none absolute -right-6 -top-8 text-8xl opacity-10 transition group-hover:opacity-20">{s.emoji}</div>}
                  <div className="relative">
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt={s.label} className="h-14 w-14 rounded-2xl object-contain" />
                    ) : (
                      <p className="text-3xl">{s.emoji}</p>
                    )}
                    <h3 className="mt-4 text-xl font-semibold text-white">{s.label}</h3>
                    <p className="mt-1 text-sm text-white/50">{s.desc}</p>
                    <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${tema.accent}`}>
                      Ver tudo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section id="apps-assinatura" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="apps" style={secStyle("apps-assinatura")}>
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "apps", "eyebrow")}</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
              {secText(st, "apps", "title")}
            </h2>
            <div className="mt-5 flex max-w-3xl items-start gap-3 rounded-2xl border border-accent/25 bg-accent/[0.06] px-4 py-3.5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <p className="text-sm leading-relaxed text-white/80">{secText(st, "apps", "desc")}</p>
            </div>
          </div>

          <AppsUnificados aplicativos={aplicativos} cols={cardCols["apps-assinatura"] ?? 3} />
        </section>


        {/* Atualizações — feed único (boletins da IA + manuais), recentes */}
        {(atualizacoes.length > 0 || aiBoletins.length > 0) && (() => {
          type AreaKey = "emergencias" | "ti" | "anestesiologia";
          const areaConfig: { key: AreaKey; label: string; emoji: string; badge: string; border: string; color: string }[] = [
            { key: "emergencias", label: "Emergências",      emoji: "🚑", badge: "bg-emerg/15 text-emerg border-emerg/30",    border: "hover:border-emerg/40",    color: "text-emerg" },
            { key: "ti",          label: "Terapia Intensiva",emoji: "🏥", badge: "bg-inten/15 text-inten border-inten/30",  border: "hover:border-inten/40",   color: "text-inten" },
            { key: "anestesiologia", label: "Anestesiologia",emoji: "🩺", badge: "bg-anest/15 text-anest border-anest/30", border: "hover:border-anest/40", color: "text-anest" },
          ];
          const grouped: Record<AreaKey, typeof atualizacoes> = { emergencias: [], ti: [], anestesiologia: [] };
          for (const item of atualizacoes) {
            if (grouped[item.area as AreaKey]) grouped[item.area as AreaKey].push(item);
          }
          const visibleAreas = areaConfig.filter((a) => grouped[a.key].length > 0);
          if (visibleAreas.length === 0 && aiBoletins.length === 0) return null;
          return (
            <section id="atualizacoes" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="atualizacoes" style={secStyle("atualizacoes")}>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "atualizacoes", "eyebrow")}</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">
                    {secText(st, "atualizacoes", "title")}
                  </h2>
                </div>
                <a
                  href="/atualizacoes"
                  className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20"
                >
                  {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <AtualizacoesFeed ai={aiBoletins} manuais={atualizacoes} limit={4} logos={espLogos} />

              <a
                href="/atualizacoes"
                className="mt-8 mx-auto flex w-fit items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20"
              >
                {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </section>
          );
        })()}

        {/* Protocolos — sempre visível (área própria, separada dos apps) */}
        {(() => {
          const sorted = [...protocolos].sort(
            (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
          );
          const recent = sorted.slice(0, (cardCols["protocolos"] ?? 3) * 3);
          const hasContent = protocolos.length > 0;
          return (
            <section id="protocolos" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="protocolos" style={secStyle("protocolos")}>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "protocolos", "eyebrow")}</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">
                    {secText(st, "protocolos", "title")}
                  </h2>
                </div>
                {hasContent && (
                  <Link
                    href="/protocolos"
                    className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20"
                  >
                    {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {hasContent ? (
                <>
                  {/* Mesmo card da página /protocolos e das especialidades: expande NO LOCAL. */}
                  <div className="card-grid gap-4" style={colStyle(cardCols["protocolos"] ?? 3)}>
                    {recent.map((item) => (
                      <ProtocoloCard key={item.id} item={item} />
                    ))}
                  </div>

                  <Link
                    href="/protocolos"
                    className="mt-8 mx-auto flex w-fit items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20"
                  >
                    {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
                  <p className="text-sm font-medium text-white/70">{uiText(ui, "vazioProtocolosTitulo")}</p>
                  <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-white/40">{uiText(ui, "vazioProtocolosTexto")}</p>
                </div>
              )}
            </section>
          );
        })()}

        {/* Videoaulas teaser */}
        {videoaulas.length > 0 && (() => {
          const sorted = [...videoaulas].sort(
            (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
          );
          const recent = sorted.slice(0, (cardCols["videoaulas"] ?? 3) * 3);
          return (
            <section id="videoaulas" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="videoaulas" style={secStyle("videoaulas")}>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "videoaulas", "eyebrow")}</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">
                    {secText(st, "videoaulas", "title")}
                  </h2>
                </div>
                <a
                  href="/videoaulas"
                  className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20"
                >
                  {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="card-grid gap-4" style={colStyle(cardCols["videoaulas"] ?? 3)}>
                {recent.map((item) => (
                  <HomeVideoCard key={item.id} item={item} />
                ))}
              </div>

              <a
                href="/videoaulas"
                className="mt-8 mx-auto flex w-fit items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20"
              >
                {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </section>
          );
        })()}

        {/* Colaboradores teaser */}
        {colaboradores.filter((c) => c.titulo).length > 0 && (
          <section id="colaboradores" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="colaboradores" style={secStyle("colaboradores")}>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "colaboradores", "eyebrow")}</p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">{secText(st, "colaboradores", "title")}</h2>
                {secText(st, "page_colaboradores", "desc") && (
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">{secText(st, "page_colaboradores", "desc")}</p>
                )}
              </div>
              <a href="/colaboradores" className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20">
                {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <ColaboradoresList items={colaboradores.filter((c) => c.titulo)} cols={cardCols["colaboradores"]} limit={(cardCols["colaboradores"] ?? 3) * 3} />
            <a href="/colaboradores" className="mt-8 mx-auto flex w-fit items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20">
              {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </section>
        )}

        <section id="cursos" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="cursos" style={secStyle("cursos")}>
          <div className="finex-glass rounded-[2rem] p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-accent-violet">{secText(st, "cursos", "eyebrow")}</p>
                <h3 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
                  {secText(st, "cursos", "title")}
                </h3>
              </div>

              <div className="space-y-3">
                {courses.map((topic) => {
                  const inner = (
                    <>
                      <GraduationCap className="h-4 w-4 text-accent-violet" />
                      <p className="text-sm text-white/85">{topic.title}</p>
                    </>
                  );
                  return topic.link ? (
                    <a
                      id={topic.id}
                      key={topic.id}
                      href={topic.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-accent-violet/35 hover:bg-black/30"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div
                      id={topic.id}
                      key={topic.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-accent-violet/35 hover:bg-black/30"
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Podcast teaser */}
        {podcasts.filter((p) => p.titulo).length > 0 && (
          <section id="podcast" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="podcast" style={secStyle("podcast")}>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "podcast", "eyebrow")}</p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">{secText(st, "podcast", "title")}</h2>
              </div>
              <a href="/podcast" className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20">
                {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <PodcastList podcasts={[...podcasts].filter((p) => p.titulo).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, (cardCols["podcast"] ?? 3) * 3)} cols={cardCols["podcast"]} />
            <a href="/podcast" className="mt-8 mx-auto flex w-fit items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20">
              {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </section>
        )}

        {/* Acervo teaser (sempre visível; mostra "em breve" quando vazio) */}
        {(
          <section id="acervo" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="acervo" style={secStyle("acervo")}>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "acervo", "eyebrow")}</p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">{secText(st, "acervo", "title")}</h2>
              </div>
              <a href="/acervo" className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20">
                {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <AcervoList itens={[...acervo].filter((p) => p.titulo).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, (cardCols["acervo"] ?? 3) * 3)} cols={cardCols["acervo"]} />
            <a href="/acervo" className="mt-8 mx-auto flex w-fit items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20">
              {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </section>
        )}

        {/* Procedimentos teaser */}
        <section id="procedimentos" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="procedimentos" style={secStyle("procedimentos")}>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "procedimentos", "eyebrow")}</p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">{secText(st, "procedimentos", "title")}</h2>
            </div>
            <a href="/procedimentos" className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20">
              {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <AcervoList itens={[...procedimentos].filter((p) => p.titulo).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, (cardCols["procedimentos"] ?? 3) * 3)} cols={cardCols["procedimentos"]} />
          <a href="/procedimentos" className="mt-8 mx-auto flex w-fit items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20">
            {uiText(ui, "verMais")} <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </section>

        {/* Calendário ÚNICO: cursos/imersões + congressos científicos juntos */}
        <div data-typo="eventos" style={secStyle("eventos")}>
          <AgendaCientifica cursos={eventos} />
        </div>

        <section id="contato" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="contato" style={secStyle("contato")}>
          <div className="finex-glass rounded-[2rem] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "contato", "eyebrow")}</p>
            <h3 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
              {secText(st, "contato", "title")}
            </h3>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {[
                {
                  label: "E-mail",
                  value: contato.email,
                  href: `mailto:${contato.email}`,
                },
                {
                  label: "WhatsApp",
                  value: contato.whatsapp,
                  href: contato.whatsappLink,
                },
                {
                  label: "Telefone",
                  value: contato.telefone,
                  href: contato.telefoneLink,
                },
                {
                  label: "Outros",
                  value: contato.instagram,
                  href: contato.instagramLink,
                },
                ...(contato.canais ?? [])
                  .filter((c) => c.label && c.url)
                  .map((c) => ({ label: c.label, value: c.valor || c.url, href: c.url })),
              ].filter((item) => item.value || item.href).map((item) => (
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
            {(() => {
              // Lista de QRs (novo). Fallback p/ o QR único legado, se ainda não migrado.
              const qrs = (contato.qrs && contato.qrs.length > 0)
                ? contato.qrs.filter((q) => q.url)
                : (contato.qrUrl ? [{ label: contato.qrLabel ?? "", url: contato.qrUrl, legenda: contato.qrLegenda }] : []);
              if (qrs.length === 0) return null;
              return (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {qrs.map((q, i) => (
                    <div key={i} className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
                      {q.label && <p className="text-sm font-semibold text-white">{q.label}</p>}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={q.url} alt={q.label || "QR code"} className="h-44 w-44 rounded-xl bg-white object-contain p-2" />
                      {q.legenda && <p className="text-xs text-white/55">{q.legenda}</p>}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-24" data-typo="whyUs" style={{ order: 8000 }}>
          <div className="grid gap-6 md:grid-cols-3">
            {whyUs.map((item) => {
              const WhyIcon = iconMap[item.icon] ?? ShieldCheck;
              return (
                <article key={item.title} className="group rounded-3xl border border-white/10 bg-[#10141d] p-6 transition hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_22px_45px_-28px_rgba(44,230,184,0.45)]">
                  <WhyIcon className="h-5 w-5 text-accent" />
                  <h4 className="mt-4 text-xl font-medium tracking-tight">{item.title}</h4>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
