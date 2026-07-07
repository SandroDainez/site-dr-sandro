export const dynamic = "force-dynamic";
export const metadata = {
  title: "Protocolos clínicos",
  description: "Algoritmos e condutas por área: emergências, terapia intensiva e anestesiologia.",
};


import { getProtocolos, getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle, getSectionTexts, getCardCols } from "@/lib/content";
import { secText } from "@/lib/section-texts";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import ProtocolosGrid from "./ProtocolosGrid";
import ProtocolosEditoraGrid from "./ProtocolosEditoraGrid";
import { getProtocolosPublicados } from "@/lib/protocolos-editora";
import Link from "next/link";

export default async function ProtocolosPage() {
  const [protocolos, header, navItems, typo, navStyle, st, cardCols, protocolosEditora] = await Promise.all([getProtocolos(), getHeader(), getNavItems(), getTypography(), getNavStyle(), getSectionTexts(), getCardCols(), getProtocolosPublicados()]);

  return (
    <div className="min-h-screen bg-[#0f1420] text-white">
      {/* Site header — same style as home */}
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

          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/protocolos" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/protocolos" />

          <Link href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">
            ← Início
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">{secText(st, "page_protocolos", "eyebrow")}</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">
            {secText(st, "page_protocolos", "title")}
          </h1>
          <p className="mt-3 text-base text-white/50">{secText(st, "page_protocolos", "desc")}</p>
        </div>

        {/* Protocolos da Editora (documentos institucionais) — lista filtrável por área. */}
        {protocolosEditora.length > 0 && <ProtocolosEditoraGrid protocolos={protocolosEditora} />}

        {/* Protocolos "de blob" (legado) — só aparecem se existirem, pra não confundir. */}
        {protocolos.length > 0 && (
          <div className="mt-14">
            <ProtocolosGrid protocolos={protocolos} cols={cardCols["protocolos"]} />
          </div>
        )}

        {protocolosEditora.length === 0 && protocolos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
            <p className="text-sm text-white/50">Protocolos em breve.</p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
