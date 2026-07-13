export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  getCursos, getVideoaulas, getColaboradores,
  getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle,
} from "@/lib/content";
import { getAulasPublicadas } from "@/lib/aulas-editora";
import { getCientificosPublicados } from "@/lib/cientifico-editora";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import AprenderView from "./AprenderView";

export const metadata = { title: "Aprender — formação", description: "Cursos, aulas, videoaulas e biblioteca científica." };

export default async function AprenderPage() {
  const [cursos, aulas, videoaulas, cientificos, colaboradores, header, navItems, typo, navStyle] = await Promise.all([
    getCursos(), getAulasPublicadas(), getVideoaulas(), getCientificosPublicados(), getColaboradores(),
    getHeader(), getNavItems(), getTypography(), getNavStyle(),
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
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/aprender" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/aprender" />
          <Link href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Início</Link>
        </div>
      </header>


      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <AprenderView cursos={cursos} aulas={aulas} videoaulas={videoaulas} cientificos={cientificos} colaboradores={colaboradores} />
      </main>

      <SiteFooter />
    </div>
  );
}
