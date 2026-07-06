export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getFlashcardPublicado, type FlashcardConteudo } from "@/lib/flashcards-editora";
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
  const b = await getFlashcardPublicado(slug);
  if (!b) return { title: "Baralho não encontrado" };
  return { title: `${b.title} — Flashcards`, description: AVISO };
}

function versoTexto(secao: string, conteudo: FlashcardConteudo): string {
  if (conteudo.textoEditado && conteudo.textoEditado[secao]) return conteudo.textoEditado[secao];
  const sec = conteudo.secoes?.find((s) => s.secao === secao);
  if (!sec) return "";
  return sec.afirmacoes.map((a) => (a.source_id ? `${a.texto} [${a.source_id}]` : `${a.texto}  ⚠ sem fonte`)).join("\n");
}

export default async function FlashcardPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [baralho, header, navItems, typo, navStyle] = await Promise.all([
    getFlashcardPublicado(slug), getHeader(), getNavItems(), getTypography(), getNavStyle(),
  ]);
  if (!baralho) notFound();

  const cartoes = baralho.conteudo.secoes ?? [];
  const referencias = baralho.conteudo.referencias ?? [];

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
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/flashcards" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/flashcards" />
          <Link href="/flashcards" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Flashcards</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link href="/flashcards" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">← Todos os baralhos</Link>

        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <p className="text-sm font-medium text-amber-100">{AVISO}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Flashcards · {ESP_LABEL[baralho.specialty] ?? baralho.specialty}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{baralho.title}</h1>
          <p className="mt-2 text-[12px] text-white/40">{cartoes.length} cartões{baralho.publicado_em ? ` · Publicado em ${dataCurta(baralho.publicado_em)}` : ""}</p>
        </div>

        <div className="space-y-3">
          {cartoes.map((sec, i) => (
            <details key={sec.secao + i} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 [&_.chevron]:open:rotate-90">
              <summary className="flex cursor-pointer list-none items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">{i + 1}</span>
                <span className="min-w-0 flex-1 text-[15px] font-medium text-white">{sec.secao}</span>
                <span className="chevron shrink-0 text-white/30 transition-transform">▸</span>
              </summary>
              <div className="mt-3 whitespace-pre-wrap border-t border-white/10 pt-3 text-[14px] leading-relaxed text-white/80">
                {versoTexto(sec.secao, baralho.conteudo) || <span className="text-white/30">—</span>}
              </div>
            </details>
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
