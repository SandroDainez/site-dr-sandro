export const dynamic = "force-dynamic";
export const metadata = {
  title: "Profissionais parceiros",
  description: "Materiais cedidos por colegas de outras instituições, com todo o crédito e nosso agradecimento.",
};


import { getColaboradores, getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle, getSectionTexts, getCardCols } from "@/lib/content";
import { secText } from "@/lib/section-texts";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import { Heart } from "lucide-react";
import ColaboradoresList from "./ColaboradoresList";

export default async function ColaboradoresPage() {
  const [items, header, navItems, typo, navStyle, st, cardCols] = await Promise.all([
    getColaboradores(), getHeader(), getNavItems(), getTypography(), getNavStyle(),
    getSectionTexts(), getCardCols(),
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
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/colaboradores" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/colaboradores" />
          <a href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Início</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "page_colaboradores", "eyebrow")}</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">{secText(st, "page_colaboradores", "title")}</h1>
          {/* Agradecimento aos profissionais que cederam material */}
          <div className="mt-6 flex max-w-2xl items-start gap-3 rounded-2xl border border-accent/25 bg-accent/[0.06] px-5 py-4">
            <Heart className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p className="text-sm leading-relaxed text-white/70">{secText(st, "page_colaboradores", "desc")}</p>
          </div>
        </div>

        <ColaboradoresList items={items} cols={cardCols["colaboradores"]} />
      </main>

      <SiteFooter />
    </div>
  );
}
