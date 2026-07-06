export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import {
  getProtocolos, getVideoaulas, getCursos, getAtualizacoes, getAcervo, getProcedimentos,
  getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle, getSectionTexts, getUiTexts, getCardCols,
} from "@/lib/content";
import { colStyle } from "@/lib/card-grid";
import { secText } from "@/lib/section-texts";
import { uiText } from "@/lib/ui-texts";
import AcervoList from "@/app/acervo/AcervoList";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import { ArrowRight, ClipboardList, FileText, PlayCircle, GraduationCap, Newspaper, Stethoscope } from "lucide-react";
import ProtocoloCard from "@/components/ProtocoloCard";
import { VideoCard } from "@/app/videoaulas/VideoaulasGrid";
import AtualizacoesFeed from "@/components/AtualizacoesFeed";
import AgendaCientifica from "@/components/AgendaCientifica";
import { siteAreaToEspecialidade } from "@/types/medical";
import { fetchMedicalUpdates } from "@/lib/supabase/server";

type Area = "emergencias" | "ti" | "anestesiologia";
const AREAS: Record<Area, { label: string; emoji: string; accent: string; grad: string; border: string; tagline: string }> = {
  emergencias: { label: "Emergências", emoji: "🚑", accent: "text-emerg", grad: "from-emerg/25 via-emerg/8 to-transparent", border: "border-emerg/30", tagline: "Condutas, protocolos e materiais de medicina de urgência e emergência." },
  ti: { label: "Terapia Intensiva", emoji: "🏥", accent: "text-inten", grad: "from-inten/25 via-inten/8 to-transparent", border: "border-inten/30", tagline: "Tudo de cuidados intensivos: protocolos, aulas, cursos e materiais." },
  anestesiologia: { label: "Anestesiologia", emoji: "🩺", accent: "text-anest", grad: "from-anest/25 via-anest/8 to-transparent", border: "border-anest/30", tagline: "Condutas, documentos e conteúdo de anestesiologia num só lugar." },
};

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const a = AREAS[area as Area];
  if (!a) return { title: "Especialidade" };
  return { title: a.label, description: a.tagline };
}

function Section({ icon: Icon, titulo, verHref, children, accent }: { icon: typeof FileText; titulo: string; verHref?: string; children: React.ReactNode; accent: string }) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Icon className={`h-5 w-5 ${accent}`} /> {titulo}
        </h2>
      </div>
      {children}
      {verHref && (
        <a href={verHref} className="mt-6 mx-auto flex w-fit items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-xs font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20">
          Ver todos <ArrowRight className="h-3.5 w-3.5" />
        </a>
      )}
    </section>
  );
}

export default async function EspecialidadePage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (!(area in AREAS)) notFound();
  const a = area as Area;
  const cfg = AREAS[a];

  const [protocolos, videoaulas, cursos, atualizacoes, acervo, procedimentos, header, navItems, typo, navStyle, st, ui, cardCols] = await Promise.all([
    getProtocolos(), getVideoaulas(), getCursos(), getAtualizacoes(), getAcervo(), getProcedimentos(),
    getHeader(), getNavItems(), getTypography(), getNavStyle(), getSectionTexts(), getUiTexts(), getCardCols(),
  ]);
  const hubKey = `hub_${a}`;

  // Um item pertence ao hub se sua área principal é `a` OU se `a` está nas áreas
  // extras (multi-especialidade): um assunto pode aparecer em mais de um hub.
  const inArea = (item: { area?: string; areas?: string[] }) => item.area === a || (item.areas?.includes(a) ?? false);

  const proto = protocolos.filter(inArea);
  const vids = videoaulas.filter(inArea);
  const curs = cursos.filter((c) => inArea(c) && c.titulo);
  const atu = [...atualizacoes].filter(inArea).sort((x, y) => new Date(y.data).getTime() - new Date(x.data).getTime());
  const docs = acervo.filter((x) => inArea(x) && x.titulo);
  const procs = procedimentos.filter((x) => inArea(x) && x.titulo);
  const aiBoletins = await fetchMedicalUpdates(siteAreaToEspecialidade(a));

  const total = proto.length + vids.length + curs.length + atu.length + docs.length + procs.length + aiBoletins.length;

  const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20";

  return (
    <div className="min-h-screen bg-[#0f1420] text-white">
      <style dangerouslySetInnerHTML={{ __html: buildTypographyCss(typo) }} />
      <header data-typo="header" className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1420]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-6 py-4 lg:flex-row lg:justify-between lg:gap-0">
          <a href="/" className="flex items-center gap-3">
            <SiteLogo header={header} variant="sm" />
            <div>
              {header.name && <p className="text-2xl font-bold tracking-tight text-white">{header.name}</p>}
              {headerSubtitleLines(header)[0] && <p className="text-xs font-semibold text-accent leading-tight">{headerSubtitleLines(header)[0]}</p>}
            </div>
          </a>
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath={`/especialidade/${a}`} /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath={`/especialidade/${a}`} />
          <a href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Início</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-14">
        <div className={`relative mb-10 overflow-hidden rounded-3xl border ${cfg.border} bg-white/[0.02] p-8 md:p-10`}>
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cfg.grad}`} />
          <div className="pointer-events-none absolute -right-10 -top-10 text-[9rem] opacity-10 blur-[1px] md:text-[12rem]">{cfg.emoji}</div>
          <div className="relative">
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${cfg.accent}`}>{secText(st, hubKey, "eyebrow")}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{cfg.emoji} {secText(st, hubKey, "title")}</h1>
            <p className="mt-3 max-w-2xl text-base text-white/65">{secText(st, hubKey, "desc")}</p>
            {total > 0 && <p className="mt-5 text-xs text-white/45">{total} {total === 1 ? "item" : "itens"} nesta especialidade</p>}
          </div>
        </div>


        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
            <p className="text-sm text-white/50">{uiText(ui, "vazioHub")}</p>
          </div>
        ) : (
          <>
            {proto.length > 0 && (
              <Section icon={ClipboardList} titulo="Protocolos" verHref="/protocolos" accent={cfg.accent}>
                <div className="card-grid gap-5" style={colStyle(cardCols["protocolos"] ?? 3)}>
                  {proto.map((p) => (
                    <ProtocoloCard key={p.id} item={p} />
                  ))}
                </div>
              </Section>
            )}

            {procs.length > 0 && (
              <Section icon={Stethoscope} titulo="Procedimentos" verHref="/procedimentos" accent={cfg.accent}>
                <AcervoList itens={procs} cols={cardCols["procedimentos"]} />
              </Section>
            )}

            {docs.length > 0 && (
              <Section icon={FileText} titulo="Documentos e materiais" verHref="/acervo" accent={cfg.accent}>
                {/* mesma experiência da página "Outros assuntos": Ler / Tela cheia / Baixar */}
                <AcervoList itens={docs} cols={cardCols["acervo"]} />
              </Section>
            )}

            {vids.length > 0 && (
              <Section icon={PlayCircle} titulo="Videoaulas" verHref="/videoaulas" accent={cfg.accent}>
                <div className="card-grid gap-5" style={colStyle(cardCols["videoaulas"] ?? 3)}>
                  {vids.map((v) => <VideoCard key={v.id} item={v} />)}
                </div>
              </Section>
            )}

            {curs.length > 0 && (
              <Section icon={GraduationCap} titulo="Cursos" verHref="/cursos" accent={cfg.accent}>
                <div className="card-grid gap-3" style={colStyle(cardCols["cursos"] ?? 3)}>
                  {curs.map((c) => (
                    <a key={c.id} href={`/cursos/${c.id}`} className={card}>
                      <p className="text-sm font-semibold text-white">{c.titulo}</p>
                      {c.resumo && <p className="mt-1 line-clamp-2 text-xs text-white/50">{c.resumo}</p>}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {(atu.length > 0 || aiBoletins.length > 0) && (
              <Section icon={Newspaper} titulo="Atualizações" verHref="/atualizacoes" accent={cfg.accent}>
                <AtualizacoesFeed ai={aiBoletins} manuais={atu} />
              </Section>
            )}
          </>
        )}

        {/* Calendário próprio da especialidade: congressos da área (agente de IA),
            no mesmo visual de calendário da home. Some se não houver eventos. */}
        <div className="mb-10">
          <AgendaCientifica
            especialidade={siteAreaToEspecialidade(a)}
            embedded
            eyebrow={`Agenda · ${cfg.label}`}
            titulo="Calendário da especialidade"
            subtitulo={`Próximos congressos e eventos de ${cfg.label.toLowerCase()} (Brasil e mundo). Clique para acessar o site oficial.`}
          />
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{uiText(ui, "hubOutrasEspecialidades")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(AREAS) as Area[]).filter((k) => k !== a).map((k) => (
              <a key={k} href={`/especialidade/${k}`} className={`group relative flex items-center justify-between overflow-hidden rounded-2xl border ${AREAS[k].border} bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04]`}>
                <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${AREAS[k].grad} opacity-60`} />
                <span className="relative flex items-center gap-3">
                  <span className="text-2xl">{AREAS[k].emoji}</span>
                  <span className={`font-semibold ${AREAS[k].accent}`}>{AREAS[k].label}</span>
                </span>
                <ArrowRight className="relative h-4 w-4 text-white/40 transition group-hover:translate-x-1 group-hover:text-white/70" />
              </a>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
