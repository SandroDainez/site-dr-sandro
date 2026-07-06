export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestaoDocPublicado } from "@/lib/questoes-editora";
import { justificativaTexto } from "@/lib/editora/questao-estrutura";
import { dataCurta } from "@/lib/format-date";
import { getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle } from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import { AlertTriangle, BookOpen, CheckCircle2 } from "lucide-react";

const AVISO = "Material educacional. Não substitui julgamento clínico individualizado.";
const ESP_LABEL: Record<string, string> = { emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getQuestaoDocPublicado(slug);
  if (!c) return { title: "Conjunto não encontrado" };
  return { title: `${c.title} — Questões`, description: AVISO };
}

export default async function QuestaoDocPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [conjunto, header, navItems, typo, navStyle] = await Promise.all([
    getQuestaoDocPublicado(slug), getHeader(), getNavItems(), getTypography(), getNavStyle(),
  ]);
  if (!conjunto) notFound();

  const questoes = conjunto.conteudo.questoes ?? [];
  const referencias = conjunto.conteudo.referencias ?? [];

  return (
    <div className="min-h-screen bg-[#0f1420] text-white">
      <style dangerouslySetInnerHTML={{ __html: buildTypographyCss(typo) }} />
      <header data-typo="header" className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1420]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-6 py-4 lg:flex-row lg:justify-between lg:gap-0">
          <Link href="/" className="flex items-center gap-3">
            <SiteLogo header={header} variant="sm" />
            <div>
              {header.name && <p className="text-2xl font-bold tracking-tight text-white">{header.name}</p>}
              {headerSubtitleLines(header)[0] && <p className="text-xs font-semibold text-accent leading-tight">{headerSubtitleLines(header)[0]}</p>}
            </div>
          </Link>
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/questoes" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/questoes" />
          <Link href="/questoes" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Questões</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link href="/questoes" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">← Todos os conjuntos</Link>

        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <p className="text-sm font-medium text-amber-100">{AVISO}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Questões · {ESP_LABEL[conjunto.specialty] ?? conjunto.specialty}{conjunto.conteudo.nivel ? ` · ${conjunto.conteudo.nivel}` : ""}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{conjunto.title}</h1>
          <p className="mt-2 text-[12px] text-white/40">{questoes.length} questões{conjunto.publicado_em ? ` · Publicado em ${dataCurta(conjunto.publicado_em)}` : ""}</p>
        </div>

        <div className="space-y-4">
          {questoes.map((q, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">{i + 1}</span>
                <p className="text-[15px] font-medium text-white">{q.enunciado}</p>
              </div>
              <ul className="space-y-1.5">
                {q.opcoes.map((op, j) => (
                  <li key={j} className="flex items-start gap-2 rounded-lg border border-white/10 px-3 py-2 text-[14px] text-white/75">
                    <strong className="text-white/50">{String.fromCharCode(65 + j)})</strong>
                    <span>{op}</span>
                  </li>
                ))}
              </ul>
              <details className="group mt-3">
                <summary className="cursor-pointer list-none text-[13px] font-semibold text-accent">▸ Ver gabarito e justificativa</summary>
                <div className="mt-2 rounded-lg border border-accent/20 bg-accent/[0.05] p-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent"><CheckCircle2 className="h-4 w-4" /> Correta: {String.fromCharCode(65 + (q.correta ?? 0))}) {q.opcoes[q.correta ?? 0]}</p>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/80">{justificativaTexto(q)}</p>
                </div>
              </details>
            </div>
          ))}
        </div>

        {referencias.length > 0 && (
          <section className="mt-8 border-t border-white/10 pt-6">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white"><BookOpen className="h-5 w-5 text-accent" /> Referências</h2>
            <ol className="space-y-2">
              {referencias.map((r) => (
                <li key={r.id} className="flex gap-2 text-[14px] leading-relaxed text-white/70">
                  <span className="shrink-0 font-mono text-[12px] text-accent">[{r.id}]</span>
                  <span>{r.autor ? `${r.autor}. ` : ""}<span className="text-white/85">{r.titulo}</span>{r.ano ? ` (${r.ano})` : ""} <span className="text-white/40">· {r.tipo}</span></span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
