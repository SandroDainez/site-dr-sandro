export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getProtocoloPublicado, type ProtocoloConteudo } from "@/lib/protocolos-editora";
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
import { AlertTriangle, Pill } from "lucide-react";

const AVISO = "Material educacional. Não substitui julgamento clínico individualizado.";

const ESP_LABEL: Record<string, string> = { emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProtocoloPublicado(slug);
  if (!p) return { title: "Protocolo não encontrado" };
  return { title: `${p.title} — Protocolo`, description: AVISO };
}

function textoSecao(secao: string, conteudo: ProtocoloConteudo): string {
  if (conteudo.textoEditado && conteudo.textoEditado[secao]) return conteudo.textoEditado[secao];
  const sec = conteudo.secoes?.find((s) => s.secao === secao);
  if (!sec) return "";
  return sec.afirmacoes.map((a) => (a.source_id ? `${a.texto} [${a.source_id}]` : `${a.texto}  ⚠ sem fonte`)).join("\n");
}

export default async function ProtocoloPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [protocolo, header, navItems, typo, navStyle] = await Promise.all([
    getProtocoloPublicado(slug), getHeader(), getNavItems(), getTypography(), getNavStyle(),
  ]);
  if (!protocolo) notFound();

  const secoes = (protocolo.conteudo.secoes ?? []).map((s) => s.secao);

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
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/protocolos" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/protocolos" />
          <Link href="/protocolos" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Protocolos</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <Link href="/protocolos" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">← Todos os protocolos</Link>

        {/* Aviso obrigatório */}
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <p className="text-sm font-medium text-amber-100">{AVISO}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Protocolo institucional · {ESP_LABEL[protocolo.specialty] ?? protocolo.specialty}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{protocolo.title}</h1>
          {protocolo.publicado_em && <p className="mt-2 text-[12px] text-white/40">Publicado em {dataCurta(protocolo.publicado_em)}</p>}
        </div>

        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
          {/* TOC navegável */}
          <nav className="mb-8 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Seções</p>
            <ul className="space-y-0.5 lg:max-h-[70vh] lg:overflow-auto">
              {secoes.map((s) => (
                <li key={s}><a href={`#${slugify(s)}`} className="block rounded-md px-2 py-1 text-[13px] text-white/55 transition hover:bg-white/[0.05] hover:text-white">{s}</a></li>
              ))}
            </ul>
          </nav>

          {/* Conteúdo */}
          <article className="min-w-0 space-y-6">
            {(protocolo.conteudo.secoes ?? []).map((sec) => {
              const texto = textoSecao(sec.secao, protocolo.conteudo);
              const isDose = sec.secao === "Doses e medicamentos";
              return (
                <section key={sec.secao} id={slugify(sec.secao)} className="scroll-mt-24">
                  <h2 className={`mb-2 flex items-center gap-2 text-xl font-semibold ${isDose ? "text-accent" : "text-white"}`}>
                    {isDose && <Pill className="h-5 w-5" />}{sec.secao}
                  </h2>
                  <div className={`whitespace-pre-wrap text-[15px] leading-relaxed text-white/80 ${isDose ? "rounded-2xl border border-accent/30 bg-accent/[0.06] p-4" : ""}`}>
                    {texto || <span className="text-white/30">—</span>}
                  </div>
                </section>
              );
            })}
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
