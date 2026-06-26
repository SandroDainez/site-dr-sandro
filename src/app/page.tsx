export const dynamic = "force-dynamic";

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
  ListChecks,
  Microscope,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import CalendarioEventos from "@/components/CalendarioEventos";
import HomeVideoCard from "@/components/HomeVideoCard";
import PodcastList from "@/app/podcast/PodcastList";
import SiteFooter from "@/components/SiteFooter";
import ColaboradoresList from "@/app/colaboradores/ColaboradoresList";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import MobileNav from "@/components/MobileNav";
import { buildTypographyCss } from "@/lib/typography-sections";
import { secText } from "@/lib/section-texts";
import { sanitizeRichText } from "@/lib/rich-text";
import {
  getApps,
  getContato,
  getEventos,
  getHero,
  getHeader,
  getFreeApps,
  getUtilApps,
  getCourses,
  getWhyUs,
  getSiteConfig,
  getAtualizacoes,
  getProtocolos,
  getVideoaulas,
  getPodcasts,
  getColaboradores,
  getSectionTexts,
  getTypography,
  getNavItems,
  getNavStyle,
  headerSubtitleLines,
} from "@/lib/content";

const iconMap: Record<string, LucideIcon> = {
  Layers, CalendarClock, FileText, Zap, HeartPulse, BookOpen, AudioLines,
  BrainCircuit, ShieldCheck, Sparkles, GraduationCap, Microscope,
  Wallet, PiggyBank, ListChecks,
};


// A ordem das seções da home segue a ordem dos itens do menu (editável em /admin/menu).
const HOME_SECTIONS = [
  "apps-assinatura", "apps-gratis", "apps-uteis", "atualizacoes",
  "protocolos", "videoaulas", "colaboradores", "cursos",
  "podcast", "eventos", "contato",
];
function hrefToSectionId(href: string): string {
  const path = href.replace(/^https?:\/\/[^/]+/, "");
  if (path.includes("#")) return path.split("#").pop() || "";
  return path.replace(/^\/+|\/+$/g, "");
}
function computeHomeOrder(navItems: { href?: string }[]): Record<string, number> {
  const order: Record<string, number> = {};
  navItems.forEach((it, i) => {
    const id = hrefToSectionId(it.href || "");
    if (HOME_SECTIONS.includes(id) && order[id] === undefined) order[id] = (i + 1) * 100;
  });
  // "Apps grátis" não tem item no menu: fica logo após os apps por assinatura.
  if (order["apps-gratis"] === undefined) {
    order["apps-gratis"] = (order["apps-assinatura"] ?? 100) + 1;
  }
  // Qualquer seção ausente do menu vai para o fim, mantendo a ordem natural.
  HOME_SECTIONS.forEach((id, idx) => {
    if (order[id] === undefined) order[id] = 9000 + idx;
  });
  return order;
}

export default async function Home() {
  const [eventos, apps, contato, hero, header, freeApps, utilApps, courses, whyUs, siteConfig, atualizacoes, protocolos, videoaulas, podcasts, colaboradores, st, typo, navItems, navStyle] = await Promise.all([
    getEventos(),
    getApps(),
    getContato(),
    getHero(),
    getHeader(),
    getFreeApps(),
    getUtilApps(),
    getCourses(),
    getWhyUs(),
    getSiteConfig(),
    getAtualizacoes(),
    getProtocolos(),
    getVideoaulas(),
    getPodcasts(),
    getColaboradores(),
    getSectionTexts(),
    getTypography(),
    getNavItems(),
    getNavStyle(),
  ]);
  const homeOrder = computeHomeOrder(navItems);
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Tipografia por seção definida no admin (tamanho, fonte, cor, peso) */}
      <style dangerouslySetInnerHTML={{ __html: buildTypographyCss(typo) }} />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_8%_0%,rgba(44,230,184,0.22),transparent_60%),radial-gradient(60%_40%_at_95%_0%,rgba(95,143,255,0.22),transparent_62%),linear-gradient(180deg,#07090f_0%,#0a1020_55%,#07090f_100%)]" />
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

          <SiteNav items={navItems} style={navStyle} />

          <MobileNav items={navItems} style={navStyle} />
        </div>
      </header>

      <main className="flex flex-col">
        <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:pt-20" data-typo="hero" style={{ order: -200 }}>
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
                  href="#apps-assinatura"
                  className="finex-beam finex-beam-strong inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.9)] transition"
                >
                  Explorar plataforma <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#eventos"
                  className="finex-beam inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.9)] transition"
                >
                  Ver agenda de eventos
                </a>
              </div>
            </div>

            <div className="pointer-events-none absolute right-4 bottom-[16%] hidden rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-accent lg:block finex-chip">
              Segurança
            </div>
          </div>
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

        <section id="apps-assinatura" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="apps" style={{ order: homeOrder["apps-assinatura"] }}>
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

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {apps.map((app, idx) => {
              const AppIcon = iconMap[app.icon] ?? Layers;
              return (
              <article
                key={app.title}
                className={`group finex-scan card-open relative overflow-hidden rounded-3xl border border-white/10 bg-panel p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20 ${idx === apps.length - 1 ? "md:col-span-2 xl:col-span-1" : ""}`}
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${app.glow}`} />
                <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:bg-white/20" />
                <div className="pointer-events-none absolute bottom-0 left-1/2 h-20 w-2/3 -translate-x-1/2 rounded-full bg-accent-blue/20 blur-2xl opacity-0 transition duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    {app.thumbnailUrl ? (
                      <div
                        className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)]"
                        style={{ width: app.thumbnailSize ?? 48, height: app.thumbnailSize ?? 48 }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={app.thumbnailUrl}
                          alt={app.title}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                        <AppIcon className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <span className="rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                      Assinatura
                    </span>
                  </div>
                  <h3 className="text-2xl font-medium tracking-tight">{app.title}</h3>
                  <p
                    className="mt-1 text-sm text-accent-blue"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(app.subtitle) }}
                  />
                  <p
                    className="mt-4 text-sm leading-relaxed text-muted"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(app.text) }}
                  />
                  <div className="card-open-content mt-0 space-y-1.5">
                    {app.highlights.map((highlight) => (
                      <div key={highlight} className="flex items-center gap-2 text-xs text-white/80">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                  {app.link ? (
                    <a
                      href={app.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition group-hover:scale-[1.02] group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(95,143,255,0.35)]"
                    >
                      Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <button className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition group-hover:scale-[1.02] group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(95,143,255,0.35)]">
                      Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </article>
              );
            })}
          </div>
        </section>

        <section id="apps-gratis" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="freeApps" style={{ order: homeOrder["apps-gratis"] }}>
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "freeApps", "eyebrow")}</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{secText(st, "freeApps", "title")}</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {freeApps.map((item) => {
              const FreeIcon = iconMap[item.icon] ?? BookOpen;
              const inner = (
                <>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-emerald-500/10 to-transparent" />
                  <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:bg-white/20" />
                  <div className="relative">
                    <div className="mb-6 flex items-center justify-between">
                      {item.imageUrl ? (
                        <div
                          className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)]"
                          style={{ width: item.imageSize ?? 48, height: item.imageSize ?? 48 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                          <FreeIcon className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                        Gratuito
                      </span>
                    </div>
                    <h3 className="text-2xl font-medium tracking-tight">{item.title}</h3>
                    <p
                      className="mt-4 text-sm leading-relaxed text-muted"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.desc) }}
                    />
                    <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition group-hover:scale-[1.02] group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(95,143,255,0.35)]">
                      {item.link ? "Abrir app" : "Em breve"} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </>
              );
              const cls =
                "group finex-scan relative overflow-hidden rounded-3xl border border-white/10 bg-panel p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20";
              return item.link ? (
                <a key={item.title} href={item.link} target="_blank" rel="noreferrer" className={`${cls} block`}>
                  {inner}
                </a>
              ) : (
                <article key={item.title} className={cls}>{inner}</article>
              );
            })}
          </div>
        </section>

        {/* Apps para o dia a dia (genéricos / não-médicos) */}
        {utilApps.length > 0 && (
        <section id="apps-uteis" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="utilApps" style={{ order: homeOrder["apps-uteis"] }}>
          <div className="mb-10">
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.16em] text-amber-300">{secText(st, "utilApps", "eyebrow")}</p>
              <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-300">Novo</span>
            </div>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{secText(st, "utilApps", "title")}</h2>
            <p className="mt-3 max-w-2xl text-sm text-white/50">{secText(st, "utilApps", "desc")}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {utilApps.map((item) => {
              const UtilIcon = iconMap[item.icon] ?? Wallet;
              const inner = (
                <>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-amber-500/10 to-transparent" />
                  <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:bg-white/20" />
                  <div className="relative">
                    <div className="mb-6 flex items-center justify-between">
                      {item.imageUrl ? (
                        <div
                          className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)]"
                          style={{ width: item.imageSize ?? 48, height: item.imageSize ?? 48 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-center rounded-2xl border border-white/15 bg-white/10"
                          style={{ width: item.imageSize ?? 48, height: item.imageSize ?? 48 }}
                        >
                          <UtilIcon className="text-amber-300" style={{ width: (item.imageSize ?? 48) * 0.42, height: (item.imageSize ?? 48) * 0.42 }} />
                        </div>
                      )}
                      {item.categoria && (
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300">
                          {item.categoria}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-medium tracking-tight">{item.title}</h3>
                    <p
                      className="mt-4 text-sm leading-relaxed text-muted"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.desc) }}
                    />
                    <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition group-hover:scale-[1.02] group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(95,143,255,0.35)]">
                      {item.link ? "Abrir app" : "Em breve"} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </>
              );
              const cls =
                "group finex-scan relative overflow-hidden rounded-3xl border border-white/10 bg-panel p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20";
              return item.link ? (
                <a key={item.title} href={item.link} target="_blank" rel="noreferrer" className={`${cls} block`}>
                  {inner}
                </a>
              ) : (
                <article key={item.title} className={cls}>{inner}</article>
              );
            })}
          </div>
        </section>
        )}

        {/* Atualizações teaser — 1 card por área */}
        {atualizacoes.length > 0 && (() => {
          type AreaKey = "emergencias" | "ti" | "anestesiologia";
          const areaConfig: { key: AreaKey; label: string; emoji: string; badge: string; border: string; color: string }[] = [
            { key: "emergencias", label: "Emergências",      emoji: "🚑", badge: "bg-red-400/15 text-red-400 border-red-400/30",    border: "hover:border-red-400/40",    color: "text-red-400" },
            { key: "ti",          label: "Terapia Intensiva",emoji: "🏥", badge: "bg-blue-400/15 text-blue-400 border-blue-400/30",  border: "hover:border-blue-400/40",   color: "text-blue-400" },
            { key: "anestesiologia", label: "Anestesiologia",emoji: "🩺", badge: "bg-violet-400/15 text-violet-400 border-violet-400/30", border: "hover:border-violet-400/40", color: "text-violet-400" },
          ];
          const grouped: Record<AreaKey, typeof atualizacoes> = { emergencias: [], ti: [], anestesiologia: [] };
          for (const item of atualizacoes) {
            if (grouped[item.area as AreaKey]) grouped[item.area as AreaKey].push(item);
          }
          const visibleAreas = areaConfig.filter((a) => grouped[a.key].length > 0);
          if (visibleAreas.length === 0) return null;
          return (
            <section id="atualizacoes" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="atualizacoes" style={{ order: homeOrder["atualizacoes"] }}>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "atualizacoes", "eyebrow")}</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">
                    {secText(st, "atualizacoes", "title")}
                  </h2>
                </div>
                <a
                  href="/atualizacoes"
                  className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20 sm:inline-flex"
                >
                  Ver todas <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleAreas.map((area) => {
                  const sorted = [...grouped[area.key]].sort(
                    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
                  );
                  const latest = sorted[0];
                  return (
                    <a
                      key={area.key}
                      href={`/atualizacoes#${latest.id}`}
                      className={`group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 ${area.border}`}
                    >
                      <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between">
                        <span className={`rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${area.badge}`}>
                          {area.emoji} {area.label}
                        </span>
                        <span className="text-xs text-white/30">{sorted.length} item{sorted.length !== 1 ? "s" : ""}</span>
                      </div>
                      <h3 className={`mt-4 text-base font-semibold leading-snug ${area.color}`}>
                        {latest.titulo}
                      </h3>
                      <p
                        className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/50 flex-1"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichText(latest.conteudo) }}
                      />
                      <div className={`mt-4 flex items-center gap-1 text-xs font-medium ${area.color} opacity-0 transition group-hover:opacity-100`}>
                        Ver atualizações <ArrowRight className="h-3 w-3" />
                      </div>
                      </div>
                    </a>
                  );
                })}
              </div>

              <a
                href="/atualizacoes"
                className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20 sm:hidden"
              >
                Ver todas <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </section>
          );
        })()}

        {/* Protocolos — sempre visível (área própria, separada dos apps) */}
        {(() => {
          const sorted = [...protocolos].sort(
            (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
          );
          const recent = sorted.slice(0, 3);
          const hasContent = protocolos.length > 0;
          const areaBadge: Record<string, string> = {
            emergencias: "bg-red-400/15 text-red-400 border-red-400/30",
            ti: "bg-blue-400/15 text-blue-400 border-blue-400/30",
            anestesiologia: "bg-violet-400/15 text-violet-400 border-violet-400/30",
          };
          const areaLabel: Record<string, string> = {
            emergencias: "Emergências",
            ti: "Terapia Intensiva",
            anestesiologia: "Anestesiologia",
          };
          return (
            <section id="protocolos" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="protocolos" style={{ order: homeOrder["protocolos"] }}>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "protocolos", "eyebrow")}</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">
                    {secText(st, "protocolos", "title")}
                  </h2>
                </div>
                {hasContent && (
                  <a
                    href="/protocolos"
                    className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20 sm:inline-flex"
                  >
                    Ver todos <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {hasContent ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recent.map((item) => (
                      <a
                        key={item.id}
                        href={`/protocolos#${item.id}`}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-white/20"
                      >
                        {item.imageUrl && (
                          // Infográfico de fundo escuro — sem branco; funde no card
                          <div className="overflow-hidden border-b border-white/10 bg-black/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.imageUrl} alt="" className="aspect-square w-full object-contain" />
                          </div>
                        )}
                        <div className="flex flex-1 flex-col p-5">
                        <span
                          className={`self-start rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${areaBadge[item.area] ?? "text-white/60 border-white/20"}`}
                        >
                          {areaLabel[item.area] ?? item.area}
                        </span>
                        <h3 className="mt-3 text-base font-semibold leading-snug text-white">
                          {item.titulo}
                        </h3>
                        <p
                          className="mt-2 text-sm leading-relaxed text-white/50 flex-1"
                          dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.descricao) }}
                        />
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent/80 transition group-hover:text-accent">
                          Ver protocolo <ArrowRight className="h-3 w-3" />
                        </span>
                        </div>
                      </a>
                    ))}
                  </div>

                  <a
                    href="/protocolos"
                    className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20 sm:hidden"
                  >
                    Ver todos <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
                  <p className="text-sm font-medium text-white/70">Protocolos em breve</p>
                  <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-white/40">
                    Condutas clínicas passo a passo por área — Emergências, Terapia Intensiva e Anestesiologia.
                  </p>
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
          const recent = sorted.slice(0, 3);
          return (
            <section id="videoaulas" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="videoaulas" style={{ order: homeOrder["videoaulas"] }}>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "videoaulas", "eyebrow")}</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">
                    {secText(st, "videoaulas", "title")}
                  </h2>
                </div>
                <a
                  href="/videoaulas"
                  className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20 sm:inline-flex"
                >
                  Ver todas <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((item) => (
                  <HomeVideoCard key={item.id} item={item} />
                ))}
              </div>

              <a
                href="/videoaulas"
                className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20 sm:hidden"
              >
                Ver todas <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </section>
          );
        })()}

        {/* Colaboradores teaser */}
        {colaboradores.filter((c) => c.titulo).length > 0 && (
          <section id="colaboradores" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="colaboradores" style={{ order: homeOrder["colaboradores"] }}>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "colaboradores", "eyebrow")}</p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">{secText(st, "colaboradores", "title")}</h2>
              </div>
              <a href="/colaboradores" className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20 sm:inline-flex">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <ColaboradoresList items={[...colaboradores].filter((c) => c.titulo).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 3)} />
            <a href="/colaboradores" className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20 sm:hidden">
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </section>
        )}

        <section id="cursos" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="cursos" style={{ order: homeOrder["cursos"] }}>
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
          <section id="podcast" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="podcast" style={{ order: homeOrder["podcast"] }}>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "podcast", "eyebrow")}</p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">{secText(st, "podcast", "title")}</h2>
              </div>
              <a href="/podcast" className="group hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20 sm:inline-flex">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <PodcastList podcasts={[...podcasts].filter((p) => p.titulo).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 3)} />
            <a href="/podcast" className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20 sm:hidden">
              Ver todos os episódios <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </section>
        )}

        <div data-typo="eventos" style={{ order: homeOrder["eventos"] }}>
          <CalendarioEventos eventos={eventos} />
        </div>

        <section id="contato" className="scroll-mt-32 mx-auto w-full max-w-7xl px-6 pb-24" data-typo="contato" style={{ order: homeOrder["contato"] }}>
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
