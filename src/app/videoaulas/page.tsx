export const dynamic = "force-dynamic";

import { getVideoaulas, getHeader, getNavItems, getTypography, headerSubtitleLines } from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import { buildTypographyCss } from "@/lib/typography-sections";
import VideoaulasGrid from "./VideoaulasGrid";

export default async function VideoaulasPage() {
  const [videoaulas, header, navItems, typo] = await Promise.all([getVideoaulas(), getHeader(), getNavItems(), getTypography()]);

  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      {/* Site header */}
      <style dangerouslySetInnerHTML={{ __html: buildTypographyCss(typo) }} />
      <header data-typo="header" className="sticky top-0 z-50 border-b border-white/10 bg-[#07090f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-6 py-4 lg:flex-row lg:justify-between lg:gap-0">
          {/* Logo + name */}
          <a href="/" className="flex items-center gap-3">
            <SiteLogo header={header} variant="sm" />
            <div>
              {header.name && <p className="text-2xl font-bold tracking-tight text-white">{header.name}</p>}
              {headerSubtitleLines(header)[0] && <p className="text-xs font-semibold text-accent leading-tight">{headerSubtitleLines(header)[0]}</p>}
            </div>
          </a>

          {/* Nav */}
          <SiteNav items={navItems} internal currentPath="/videoaulas" />

          {/* Mobile back */}
          <a
            href="/"
            className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden"
          >
            ← Início
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Conteúdo em vídeo</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">Videoaulas</h1>
          <p className="mt-3 text-base text-white/50">
            Aulas médicas em vídeo por área
          </p>
        </div>

        <VideoaulasGrid videoaulas={videoaulas} />
      </main>

      <footer className="border-t border-white/10 bg-black/20 py-8">
        <div className="mx-auto w-full max-w-7xl px-6 flex items-center justify-between text-sm text-white/40">
          <a href="/" className="transition hover:text-white">← Início</a>
          <a href="/protocolos" className="transition hover:text-white">Protocolos →</a>
        </div>
      </footer>
    </div>
  );
}
