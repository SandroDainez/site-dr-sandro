export const dynamic = "force-dynamic";

import { getColaboradores, getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle } from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import ColaboradoresList from "./ColaboradoresList";

export default async function ColaboradoresPage() {
  const [items, header, navItems, typo, navStyle] = await Promise.all([
    getColaboradores(), getHeader(), getNavItems(), getTypography(), getNavStyle(),
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
          <SiteNav items={navItems} style={navStyle} internal currentPath="/colaboradores" />
          <MobileNav items={navItems} style={navStyle} internal currentPath="/colaboradores" />
          <a href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Início</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Comunidade médica</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">Vídeos de colaboradores</h1>
          <p className="mt-3 max-w-2xl text-base text-white/50">
            Conteúdo de outros médicos que autorizaram a publicação, com crédito ao autor.
          </p>
        </div>

        <ColaboradoresList items={items} />
      </main>

      <SiteFooter />
    </div>
  );
}
