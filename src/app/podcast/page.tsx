export const dynamic = "force-dynamic";
export const metadata = {
  title: "Podcast",
  description: "Episódios em áudio e vídeo — discussão de casos, condutas e atualizações.",
};


import { getPodcasts, getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle, getSectionTexts } from "@/lib/content";
import { secText } from "@/lib/section-texts";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import PodcastList from "./PodcastList";

export default async function PodcastPage() {
  const [podcasts, header, navItems, typo, navStyle, st] = await Promise.all([
    getPodcasts(), getHeader(), getNavItems(), getTypography(), getNavStyle(),
    getSectionTexts(),
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
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/podcast" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/podcast" />
          <a href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Início</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "page_podcast", "eyebrow")}</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">{secText(st, "page_podcast", "title")}</h1>
          <p className="mt-3 text-base text-white/50">{secText(st, "page_podcast", "desc")}</p>
        </div>

        <PodcastList podcasts={podcasts} />
      </main>

      <SiteFooter />
    </div>
  );
}
