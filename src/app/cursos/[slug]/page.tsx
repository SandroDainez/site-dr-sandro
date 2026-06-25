export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import {
  getCurso, getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle,
} from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import MobileNav from "@/components/MobileNav";
import { buildTypographyCss } from "@/lib/typography-sections";
import { sanitizeRichText } from "@/lib/rich-text";
import { Lock } from "lucide-react";
import CursoView from "./CursoView";

const areaBadge: Record<string, string> = {
  emergencias: "bg-red-400/15 text-red-400 border-red-400/30",
  ti: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  anestesiologia: "bg-violet-400/15 text-violet-400 border-violet-400/30",
  geral: "bg-teal-400/15 text-teal-400 border-teal-400/30",
};
const areaLabel: Record<string, string> = {
  emergencias: "Emergências",
  ti: "Terapia Intensiva",
  anestesiologia: "Anestesiologia",
  geral: "Geral",
};
const nivelLabel: Record<string, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export default async function CursoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [curso, header, navItems, typo, navStyle] = await Promise.all([
    getCurso(slug), getHeader(), getNavItems(), getTypography(), getNavStyle(),
  ]);

  if (!curso || !curso.titulo) notFound();

  const pago = curso.acesso === "pago";

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
          <SiteNav items={navItems} style={navStyle} internal currentPath="/cursos" />
          <MobileNav items={navItems} style={navStyle} internal currentPath="/cursos" />
          <a href="/cursos" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Cursos</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <a href="/cursos" className="mb-6 inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white">← Todos os cursos</a>

        {/* Hero do curso */}
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${areaBadge[curso.area]}`}>
                {areaLabel[curso.area]}
              </span>
              {curso.nivel && (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-white/50">{nivelLabel[curso.nivel]}</span>
              )}
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${pago ? "border-amber-400/40 bg-amber-400/15 text-amber-300" : "border-green-400/40 bg-green-400/15 text-green-300"}`}>
                {pago ? "🔒 Em breve" : "Gratuito"}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{curso.titulo}</h1>
            {curso.professor && <p className="mt-2 text-sm text-white/50">com {curso.professor}</p>}
            {curso.descricao && (
              <div
                className="mt-4 text-sm leading-relaxed text-white/70 [&_a]:text-accent"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(curso.descricao) }}
              />
            )}
            <p className="mt-4 text-xs text-white/40">
              {curso.aulas.length} aula{curso.aulas.length !== 1 ? "s" : ""}
            </p>
          </div>

          {curso.capaUrl && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={curso.capaUrl} alt="" className="aspect-video w-full object-cover" />
            </div>
          )}
        </div>

        {/* Conteúdo / aulas */}
        <div className="mt-10">
          {pago ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] px-6 py-10 text-center">
              <Lock className="mx-auto mb-3 h-7 w-7 text-amber-300" />
              <p className="text-lg font-semibold text-white">Curso por assinatura — em breve</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
                Este curso fará parte da área de assinatura. Em breve você poderá assiná-lo
                individualmente ou pelo plano que libera todos os cursos.
              </p>
              {curso.aulas.length > 0 && (
                <div className="mx-auto mt-6 max-w-md text-left">
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-white/40">Conteúdo do curso</p>
                  <ul className="space-y-1.5">
                    {curso.aulas.map((a, i) => (
                      <li key={a.id} className="flex items-center gap-2 text-sm text-white/60">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] text-white/50">{i + 1}</span>
                        {a.titulo || `Aula ${i + 1}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : curso.aulas.length === 0 ? (
            <p className="text-sm text-white/40">As aulas deste curso estão sendo preparadas.</p>
          ) : (
            <CursoView aulas={curso.aulas} />
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 bg-black/20 py-8">
        <div className="mx-auto w-full max-w-5xl px-6 flex items-center justify-between text-sm text-white/40">
          <a href="/cursos" className="transition hover:text-white">← Cursos</a>
          <a href="/" className="transition hover:text-white">Início →</a>
        </div>
      </footer>
    </div>
  );
}
