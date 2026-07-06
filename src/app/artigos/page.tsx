export const dynamic = "force-dynamic";
export const metadata = {
  title: "Artigos",
  description: "Artigos e matérias médicas — emergências, terapia intensiva e anestesiologia.",
};

import { getArtigosPublicados, type ArtigoEspecialidade } from "@/lib/editora";
import { getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle } from "@/lib/content";
import { dataCurta } from "@/lib/format-date";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import { Newspaper } from "lucide-react";

const ESP_BADGE: Record<ArtigoEspecialidade, string> = {
  emergencias: "bg-emerg/15 text-emerg border-emerg/30",
  ti: "bg-inten/15 text-inten border-inten/30",
  anestesiologia: "bg-anest/15 text-anest border-anest/30",
  geral: "bg-accent/15 text-accent border-accent/30",
};
const ESP_LABEL: Record<ArtigoEspecialidade, string> = {
  emergencias: "Emergências",
  ti: "Terapia Intensiva",
  anestesiologia: "Anestesiologia",
  geral: "Geral",
};

export default async function ArtigosPage() {
  const [artigos, header, navItems, typo, navStyle] = await Promise.all([
    getArtigosPublicados(), getHeader(), getNavItems(), getTypography(), getNavStyle(),
  ]);

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
          <a href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Início</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Editora Médica</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight md:text-4xl">Artigos e matérias</h1>
        </div>

        {artigos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-20 text-center">
            <Newspaper className="mx-auto mb-3 h-8 w-8 text-white/25" />
            <p className="text-sm text-white/50">Em breve, artigos publicados aqui.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {artigos.map((a) => (
              <a key={a.id} href={`/artigos/${a.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
                {a.capa_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" decoding="async" src={a.capa_url} alt={a.titulo} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-accent/10 to-transparent text-accent/50"><Newspaper className="h-8 w-8" /></div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${ESP_BADGE[a.especialidade]}`}>{ESP_LABEL[a.especialidade]}</span>
                    <span className="text-[11px] text-white/35">{dataCurta(a.publicado_em ?? a.criado_em)}</span>
                  </div>
                  <h2 className="text-[15px] font-semibold leading-snug text-white group-hover:text-accent">{a.titulo}</h2>
                  {a.resumo && <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-white/55">{a.resumo}</p>}
                  {a.autor && <p className="mt-3 text-[11px] text-white/40">por {a.autor}</p>}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
