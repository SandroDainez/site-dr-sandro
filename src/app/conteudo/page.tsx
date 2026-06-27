export const dynamic = "force-dynamic";

import {
  getProtocolos, getVideoaulas, getAtualizacoes, getCursos, getPodcasts, getAcervo,
  getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle,
} from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import ConteudoBrowser from "./ConteudoBrowser";

export const metadata = {
  title: "Todo o conteúdo",
  description: "Protocolos, videoaulas, atualizações, cursos, podcast e acervo — tudo num só lugar, filtrável por tipo e especialidade.",
};

export default async function ConteudoPage() {
  const [protocolos, videoaulas, atualizacoes, cursos, podcasts, acervo, header, navItems, typo, navStyle] = await Promise.all([
    getProtocolos(), getVideoaulas(), getAtualizacoes(), getCursos(), getPodcasts(), getAcervo(),
    getHeader(), getNavItems(), getTypography(), getNavStyle(),
  ]);

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
          <SiteNav items={navItems} style={navStyle} internal currentPath="/conteudo" />
          <MobileNav items={navItems} style={navStyle} internal currentPath="/conteudo" />
          <a href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Início</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Biblioteca</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Todo o conteúdo</h1>
          <p className="mt-3 max-w-2xl text-base text-white/65">
            Protocolos, videoaulas, atualizações, cursos, podcast e acervo — tudo num só lugar. Filtre por tipo ou por especialidade.
          </p>
        </div>

        <ConteudoBrowser
          protocolos={protocolos}
          videoaulas={videoaulas}
          atualizacoes={atualizacoes}
          cursos={cursos}
          podcasts={podcasts}
          acervo={acervo}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
