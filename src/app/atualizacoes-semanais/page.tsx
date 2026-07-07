export const dynamic = "force-dynamic";

import Link from "next/link";
import { getHeader, getNavItems, getTypography, headerSubtitleLines, getNavStyle, getSectionTexts } from "@/lib/content";
import type { MedicalUpdate } from "@/types/medical";
import { secText } from "@/lib/section-texts";
import { createPublicClient, supabaseConfigured } from "@/lib/supabase/server";
import SiteLogo from "@/components/SiteLogo";
import SiteNav from "@/components/SiteNav";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import { buildTypographyCss } from "@/lib/typography-sections";
import AtualizacoesSemanaisBrowser from "./AtualizacoesSemanaisBrowser";

export const metadata = {
  title: "Atualizações clínicas — histórico",
  description: "Arquivo das atualizações clínicas semanais por especialidade, com fontes e referências.",
};

export default async function AtualizacoesSemanaisPage({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const [{ area }, header, navItems, typo, navStyle, st] = await Promise.all([
    searchParams, getHeader(), getNavItems(), getTypography(), getNavStyle(), getSectionTexts(),
  ]);

  let updates: MedicalUpdate[] = [];
  if (supabaseConfigured()) {
    try {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("medical_updates")
        .select("*")
        .eq("publicado", true)
        .order("data_publicacao", { ascending: false })
        .limit(200);
      updates = (data ?? []) as MedicalUpdate[];
    } catch {
      updates = [];
    }
  }

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
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/atualizacoes-semanais" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/atualizacoes-semanais" />
          <Link href="/" className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden">← Início</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-14">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{secText(st, "page_atualizacoes_semanais", "eyebrow")}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{secText(st, "page_atualizacoes_semanais", "title")}</h1>
          <p className="mt-3 max-w-2xl text-base text-white/65">{secText(st, "page_atualizacoes_semanais", "desc")}</p>
        </div>

        <AtualizacoesSemanaisBrowser updates={updates} initialArea={area ?? "todas"} />
      </main>

      <SiteFooter />
    </div>
  );
}
