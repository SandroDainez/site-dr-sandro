export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import {
  getProtocolos, getVideoaulas, getCursos, getAtualizacoes, getAcervo,
  getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle,
} from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import { ArrowRight, ClipboardList, FileText, PlayCircle, GraduationCap, Newspaper, Download } from "lucide-react";
import { HubArticles, HubVideos } from "./HubContent";

type Area = "emergencias" | "ti" | "anestesiologia";
const AREAS: Record<Area, { label: string; emoji: string; accent: string; grad: string; border: string; tagline: string }> = {
  emergencias: { label: "Emergências", emoji: "🚑", accent: "text-red-400", grad: "from-red-500/25 via-red-500/8 to-transparent", border: "border-red-400/30", tagline: "Condutas, protocolos e materiais de medicina de urgência e emergência." },
  ti: { label: "Terapia Intensiva", emoji: "🏥", accent: "text-blue-400", grad: "from-blue-500/25 via-blue-500/8 to-transparent", border: "border-blue-400/30", tagline: "Tudo de cuidados intensivos: protocolos, aulas, cursos e materiais." },
  anestesiologia: { label: "Anestesiologia", emoji: "🩺", accent: "text-violet-400", grad: "from-violet-500/25 via-violet-500/8 to-transparent", border: "border-violet-400/30", tagline: "Condutas, documentos e conteúdo de anestesiologia num só lugar." },
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
        {verHref && (
          <a href={verHref} className="hidden items-center gap-1 text-xs font-medium text-accent/80 transition hover:text-accent sm:flex">
            Ver todos <ArrowRight className="h-3 w-3" />
          </a>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function EspecialidadePage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (!(area in AREAS)) notFound();
  const a = area as Area;
  const cfg = AREAS[a];

  const [protocolos, videoaulas, cursos, atualizacoes, acervo, header, navItems, typo, navStyle] = await Promise.all([
    getProtocolos(), getVideoaulas(), getCursos(), getAtualizacoes(), getAcervo(),
    getHeader(), getNavItems(), getTypography(), getNavStyle(),
  ]);

  const proto = protocolos.filter((p) => p.area === a);
  const vids = videoaulas.filter((v) => v.area === a);
  const curs = cursos.filter((c) => c.area === a && c.titulo);
  const atu = [...atualizacoes].filter((x) => x.area === a).sort((x, y) => new Date(y.data).getTime() - new Date(x.data).getTime());
  const docs = acervo.filter((x) => x.area === a && x.titulo);

  const total = proto.length + vids.length + curs.length + atu.length + docs.length;

  const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20";

  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      <style dangerouslySetInnerHTML={{ __html: buildTypographyCss(typo) }} />
      <header data-typo="header" className="sticky top-0 z-50 border-b border-white/10 bg-[#07090f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-6 py-4 lg:flex-row lg:justify-between lg:gap-0">
          <a href="/" className="flex items-center gap-3">
            <SiteLogo header={header} variant="sm" />
            <div>
              {header.name && <p className="text-2xl font-bold tracking-tight text-white">{header.name}</p>}
              {headerSubtitleLines(header)[0] && <p className="text-xs font-semibold text-accent leading-tight">{headerSubtitleLines(header)[0]}</p>}
            </div>
          </a>
          <SiteNav items={navItems} style={navStyle} internal currentPath={`/especialidade/${a}`} />
          <MobileNav items={navItems} style={navStyle} internal currentPath={`/especialidade/${a}`} />
          <a href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Início</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-14">
        <div className={`relative mb-10 overflow-hidden rounded-3xl border ${cfg.border} bg-white/[0.02] p-8 md:p-10`}>
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cfg.grad}`} />
          <div className="pointer-events-none absolute -right-10 -top-10 text-[9rem] opacity-10 blur-[1px] md:text-[12rem]">{cfg.emoji}</div>
          <div className="relative">
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${cfg.accent}`}>Especialidade</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{cfg.emoji} {cfg.label}</h1>
            <p className="mt-3 max-w-2xl text-base text-white/65">{cfg.tagline}</p>
            {total > 0 && <p className="mt-5 text-xs text-white/45">{total} {total === 1 ? "item" : "itens"} nesta especialidade</p>}
          </div>
        </div>

        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
            <p className="text-sm text-white/50">Conteúdo de {cfg.label} em breve.</p>
          </div>
        ) : (
          <>
            {proto.length > 0 && (
              <Section icon={ClipboardList} titulo="Protocolos" verHref="/protocolos" accent={cfg.accent}>
                <HubArticles
                  accent={cfg.accent}
                  items={proto.map((p) => ({
                    id: p.id,
                    titulo: p.titulo,
                    conteudo: p.conteudo,
                    resumo: p.descricao,
                    imageUrl: p.imageUrl,
                    imageCaption: p.imageCaption,
                    imageSize: p.imageSize,
                    data: p.data,
                    download: p.arquivoUrl ? { url: p.arquivoUrl, label: p.arquivoLabel || "Abrir material" } : undefined,
                  }))}
                />
              </Section>
            )}

            {docs.length > 0 && (
              <Section icon={FileText} titulo="Documentos e materiais" verHref="/acervo" accent={cfg.accent}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {docs.map((d) => (
                    <div key={d.id} className={card}>
                      <p className="text-sm font-semibold text-white">{d.titulo}</p>
                      {d.arquivos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {d.arquivos.filter((x) => x.url).map((arq) => (
                            <a key={arq.id} href={arq.url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent transition hover:bg-accent/20">
                              <Download className="h-3 w-3" /> {arq.titulo || arq.tipo}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {vids.length > 0 && (
              <Section icon={PlayCircle} titulo="Videoaulas" verHref="/videoaulas" accent={cfg.accent}>
                <HubVideos
                  accent={cfg.accent}
                  items={vids.map((v) => ({ id: v.id, titulo: v.titulo, descricao: v.descricao, videoUrl: v.videoUrl, duracao: v.duracao }))}
                />
              </Section>
            )}

            {curs.length > 0 && (
              <Section icon={GraduationCap} titulo="Cursos" verHref="/cursos" accent={cfg.accent}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {curs.map((c) => (
                    <a key={c.id} href={`/cursos/${c.id}`} className={card}>
                      <p className="text-sm font-semibold text-white">{c.titulo}</p>
                      {c.resumo && <p className="mt-1 line-clamp-2 text-xs text-white/50">{c.resumo}</p>}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {atu.length > 0 && (
              <Section icon={Newspaper} titulo="Atualizações" verHref="/atualizacoes" accent={cfg.accent}>
                <HubArticles
                  accent={cfg.accent}
                  items={atu.map((x) => ({
                    id: x.id,
                    titulo: x.titulo,
                    conteudo: x.conteudo,
                    imageUrl: x.imageUrl,
                    imageCaption: x.imageCaption,
                    imageSize: x.imageSize,
                    data: x.data,
                  }))}
                />
              </Section>
            )}
          </>
        )}

        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Outras especialidades</p>
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
