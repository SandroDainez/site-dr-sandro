export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sínteses de evidência",
  description: "Sínteses de evidência científica sobre perguntas clínicas, com fontes citadas.",
};

import Link from "next/link";
import { getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle } from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import { getResearchPublicados } from "@/lib/research-editora";
import { ArrowRight, Search } from "lucide-react";

const ESP_LABEL: Record<string, string> = { emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral" };

export default async function PesquisasPage() {
  const [docs, header, navItems, typo, navStyle] = await Promise.all([
    getResearchPublicados("pesquisador"), getHeader(), getNavItems(), getTypography(), getNavStyle(),
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
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/pesquisas" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/pesquisas" />
          <Link href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Início</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Editora Médica</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">Sínteses de evidência</h1>
          <p className="mt-3 text-base text-white/50">Perguntas clínicas respondidas com síntese crítica da evidência e fontes citadas.</p>
        </div>

        {docs.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-sm text-white/40">Nenhuma síntese publicada ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((d) => (
              <a key={d.id} href={`/pesquisas/${d.slug}`} className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-accent/40 hover:bg-white/[0.05]">
                <div className="flex items-center justify-between">
                  <Search className="h-5 w-5 text-accent" />
                  <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">{ESP_LABEL[d.specialty] ?? d.specialty}</span>
                </div>
                <h3 className="text-[15px] font-semibold leading-snug text-white group-hover:text-accent">{d.title}</h3>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-accent">Ver síntese <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
              </a>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
