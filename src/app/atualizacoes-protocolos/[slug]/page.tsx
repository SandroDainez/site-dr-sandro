export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAtualizacaoPublicada, type AtualizacaoConteudo } from "@/lib/atualizacoes-editora";
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
  const d = await getAtualizacaoPublicada(slug);
  if (!d) return { title: "Atualização não encontrada" };
  return { title: `${d.title}`, description: AVISO };
}

function textoSecao(secao: string, conteudo: AtualizacaoConteudo): string {
  if (conteudo.textoEditado && conteudo.textoEditado[secao]) return conteudo.textoEditado[secao];
  const sec = conteudo.secoes?.find((s) => s.secao === secao);
  if (!sec) return "";
  return sec.afirmacoes.map((a) => a.texto).join("\n");
}

export default async function AtualizacaoPublicaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [atualizacao, header, navItems, typo, navStyle] = await Promise.all([
    getAtualizacaoPublicada(slug), getHeader(), getNavItems(), getTypography(), getNavStyle(),
  ]);
  if (!atualizacao) notFound();

  const referencias = atualizacao.conteudo.referencias ?? [];

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
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/atualizacoes-protocolos" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/atualizacoes-protocolos" />
          <Link href="/atualizacoes-protocolos" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Atualizações</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link href="/atualizacoes-protocolos" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">← Todas as atualizações</Link>

        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <p className="text-sm font-medium text-amber-100">{AVISO}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Atualização de protocolo · {ESP_LABEL[atualizacao.specialty] ?? atualizacao.specialty}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{atualizacao.title}</h1>
          {atualizacao.publicado_em && <p className="mt-2 text-[12px] text-white/40">Publicado em {dataCurta(atualizacao.publicado_em)}</p>}
        </div>

        <article className="min-w-0 space-y-6">
          {(atualizacao.conteudo.secoes ?? []).map((sec) => (
            <section key={sec.secao} id={slugify(sec.secao)} className="scroll-mt-24">
              <h2 className="mb-2 text-xl font-semibold text-white">{sec.secao}</h2>
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/80">
                {textoSecao(sec.secao, atualizacao.conteudo) || <span className="text-white/30">—</span>}
              </div>
            </section>
          ))}

          {referencias.length > 0 && (
            <section id="referencias" className="scroll-mt-24 border-t border-white/10 pt-6">
              <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white"><BookOpen className="h-5 w-5 text-accent" /> Evidências citadas</h2>
              <ol className="space-y-2">
                {referencias.map((r) => (
                  <li key={r.id} className="flex gap-2 text-[14px] leading-relaxed text-white/70">
                    <span className="shrink-0 font-mono text-[12px] text-accent">[{r.id}]</span>
                    <span>
                      {r.autor ? `${r.autor}. ` : ""}
                      {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="text-white/85 underline decoration-white/20 hover:decoration-accent">{r.titulo}</a> : <span className="text-white/85">{r.titulo}</span>}
                      {r.ano ? ` (${r.ano})` : ""} <span className="text-white/40">· {r.tipo === "pubmed" ? "PubMed" : "biblioteca interna"}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
