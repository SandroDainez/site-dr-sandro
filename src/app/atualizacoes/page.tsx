export const dynamic = "force-dynamic";

import { getAtualizacoes, getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle, getSectionTexts } from "@/lib/content";
import { secText } from "@/lib/section-texts";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import AtualizacoesGrid from "./AtualizacoesGrid";

export default async function AtualizacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const [atualizacoes, header, params, navItems, typo, navStyle, st] = await Promise.all([getAtualizacoes(), getHeader(), searchParams, getNavItems(), getTypography(), getNavStyle(), getSectionTexts()]);
  const initialArea = params.area ?? "todas";

  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      {/* Site header — identical style to home page */}
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
          <SiteNav items={navItems} style={navStyle} internal currentPath="/atualizacoes" />
          <MobileNav items={navItems} style={navStyle} internal currentPath="/atualizacoes" />

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
          <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "page_atualizacoes", "eyebrow")}</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">{secText(st, "page_atualizacoes", "title")}</h1>
          <p className="mt-3 text-base text-white/50">{secText(st, "page_atualizacoes", "desc")}</p>
          {/* Selos: revisão rápida + atualização semanal */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent">
              ⚡ Revisão rápida
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-blue/30 bg-accent-blue/10 px-3.5 py-1.5 text-xs font-semibold text-accent-blue">
              🔄 Atualizada semanalmente
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/70">
              📈 Baseada em evidência recente
            </span>
          </div>
        </div>

        <AtualizacoesGrid atualizacoes={atualizacoes} initialArea={initialArea} />
      </main>

      <SiteFooter />
    </div>
  );
}
