export const dynamic = "force-dynamic";

import { getProtocolos, getHeader, getNavItems, getTypography, headerSubtitleLines } from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import { buildTypographyCss } from "@/lib/typography-sections";
import ProtocolosGrid from "./ProtocolosGrid";

export default async function ProtocolosPage() {
  const [protocolos, header, navItems, typo] = await Promise.all([getProtocolos(), getHeader(), getNavItems(), getTypography()]);

  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      {/* Site header — same style as home */}
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

          <SiteNav items={navItems} internal currentPath="/protocolos" />

          <a href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">
            ← Início
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Condutas clínicas</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">
            Protocolos Clínicos
          </h1>
          <p className="mt-3 text-base text-white/50">
            Algoritmos e condutas por área
          </p>
        </div>

        <ProtocolosGrid protocolos={protocolos} />
      </main>

      <footer className="border-t border-white/10 bg-black/20 py-8">
        <div className="mx-auto w-full max-w-7xl px-6 flex items-center justify-between text-sm text-white/40">
          <a href="/" className="transition hover:text-white">← Início</a>
          <a href="/atualizacoes" className="transition hover:text-white">Atualizações →</a>
        </div>
      </footer>
    </div>
  );
}
