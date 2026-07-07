export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCientificoPublicado, type CientificoConteudo } from "@/lib/cientifico-editora";
import { slugify } from "@/lib/editora";
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
import { AlertTriangle, BookOpen } from "lucide-react";

const AVISO = "Material educacional. Não substitui julgamento clínico individualizado.";
const ESP_LABEL: Record<string, string> = { emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getCientificoPublicado(slug);
  if (!d) return { title: "Texto não encontrado" };
  return { title: `${d.title} — Biblioteca científica`, description: AVISO };
}

function textoSecao(secao: string, conteudo: CientificoConteudo): string {
  if (conteudo.textoEditado && conteudo.textoEditado[secao]) return conteudo.textoEditado[secao];
  const sec = conteudo.secoes?.find((s) => s.secao === secao);
  if (!sec) return "";
  return sec.afirmacoes.map((a) => a.texto).join("\n");
}

export default async function CientificoPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [doc, header, navItems, typo, navStyle] = await Promise.all([
    getCientificoPublicado(slug), getHeader(), getNavItems(), getTypography(), getNavStyle(),
  ]);
  if (!doc) notFound();

  const secoes = (doc.conteudo.secoes ?? []).map((s) => s.secao);
  const referencias = doc.conteudo.referencias ?? [];

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
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/biblioteca-cientifica" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/biblioteca-cientifica" />
          <Link href="/biblioteca-cientifica" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Biblioteca</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <Link href="/biblioteca-cientifica" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">← Todos os textos</Link>

        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <p className="text-sm font-medium text-amber-100">{AVISO}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Texto científico · {ESP_LABEL[doc.specialty] ?? doc.specialty}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{doc.title}</h1>
          {doc.publicado_em && <p className="mt-2 text-[12px] text-white/40">Publicado em {dataCurta(doc.publicado_em)}</p>}
        </div>

        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
          <nav className="mb-8 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Seções</p>
            <ul className="space-y-0.5 lg:max-h-[70vh] lg:overflow-auto">
              {secoes.map((s) => (
                <li key={s}><a href={`#${slugify(s)}`} className="block rounded-md px-2 py-1 text-[13px] text-white/55 transition hover:bg-white/[0.05] hover:text-white">{s}</a></li>
              ))}
              {referencias.length > 0 && <li><a href="#referencias" className="block rounded-md px-2 py-1 text-[13px] text-white/55 transition hover:bg-white/[0.05] hover:text-white">Referências</a></li>}
            </ul>
          </nav>

          <article className="min-w-0 space-y-6">
            {(doc.conteudo.secoes ?? []).map((sec) => {
              const texto = textoSecao(sec.secao, doc.conteudo);
              return (
                <section key={sec.secao} id={slugify(sec.secao)} className="scroll-mt-24">
                  <h2 className="mb-2 text-xl font-semibold text-white">{sec.secao}</h2>
                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/80">
                    {texto || <span className="text-white/30">—</span>}
                  </div>
                </section>
              );
            })}

            {referencias.length > 0 && (
              <section id="referencias" className="scroll-mt-24 border-t border-white/10 pt-6">
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
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
