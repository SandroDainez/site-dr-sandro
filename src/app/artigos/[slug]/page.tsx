export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getArtigoBySlug, type ArtigoEspecialidade } from "@/lib/editora";
import { getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle } from "@/lib/content";
import { dataCurta } from "@/lib/format-date";
import { sanitizeRichText } from "@/lib/rich-text";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";

const ESP_BADGE: Record<ArtigoEspecialidade, string> = {
  emergencias: "bg-emerg/15 text-emerg border-emerg/30",
  ti: "bg-inten/15 text-inten border-inten/30",
  anestesiologia: "bg-anest/15 text-anest border-anest/30",
  geral: "bg-accent/15 text-accent border-accent/30",
};
const ESP_LABEL: Record<ArtigoEspecialidade, string> = {
  emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getArtigoBySlug(slug);
  if (!a) return { title: "Artigo não encontrado" };
  return { title: a.titulo, description: a.resumo || undefined };
}

export default async function ArtigoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [artigo, header, navItems, typo, navStyle] = await Promise.all([
    getArtigoBySlug(slug), getHeader(), getNavItems(), getTypography(), getNavStyle(),
  ]);
  if (!artigo) notFound();

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
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/artigos" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/artigos" />
          <a href="/artigos" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Artigos</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-14">
        <a href="/artigos" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">← Todos os artigos</a>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${ESP_BADGE[artigo.especialidade]}`}>{ESP_LABEL[artigo.especialidade]}</span>
          <span className="text-[11px] text-white/35">{dataCurta(artigo.publicado_em ?? artigo.criado_em)}</span>
        </div>

        <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{artigo.titulo}</h1>
        {artigo.autor && <p className="mt-3 text-sm text-white/50">por <span className="text-white/70">{artigo.autor}</span></p>}
        {artigo.resumo && <p className="mt-5 border-l-2 border-accent/40 pl-4 text-lg leading-relaxed text-white/70">{artigo.resumo}</p>}

        {artigo.capa_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artigo.capa_url} alt={artigo.titulo} className="mt-8 w-full rounded-2xl border border-white/10 object-cover" />
        )}

        <article
          className="mt-8 text-[15px] leading-relaxed text-white/80 [&_a]:text-accent [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_li]:mb-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:text-white [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(artigo.corpo) }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
