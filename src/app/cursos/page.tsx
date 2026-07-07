export const dynamic = "force-dynamic";
export const metadata = {
  title: "Cursos",
  description: "Cursos completos com aulas sequenciais, vídeos, slides e materiais.",
};


import Link from "next/link";
import { getCursos, getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle, getSectionTexts, getCardCols } from "@/lib/content";
import { secText } from "@/lib/section-texts";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import CursosCatalog from "./CursosCatalog";

export default async function CursosPage() {
  const [cursos, header, navItems, typo, navStyle, st, cardCols] = await Promise.all([
    getCursos(), getHeader(), getNavItems(), getTypography(), getNavStyle(),
    getSectionTexts(), getCardCols(),
  ]);

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
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/cursos" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/cursos" />
          <Link href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Início</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "page_cursos", "eyebrow")}</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">{secText(st, "page_cursos", "title")}</h1>
          <p className="mt-3 max-w-2xl text-base text-white/50">{secText(st, "page_cursos", "desc")}</p>
        </div>

        <CursosCatalog cursos={cursos} cols={cardCols["cursos"]} />
      </main>

      <SiteFooter />
    </div>
  );
}
