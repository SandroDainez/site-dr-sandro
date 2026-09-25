export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/supabase/auth-server";
import { getHeader, getNavItems, getNavStyle, headerSubtitleLines } from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import AuthButton from "@/components/AuthButton";
import AssistenteButton from "@/components/AssistenteButton";
import SearchButton from "@/components/SearchButton";
import SiteNav from "@/components/SiteNav";
import MobileNav from "@/components/MobileNav";
import { Brain } from "lucide-react";
import EstudoSession from "./EstudoSession";

export const metadata = { title: "Questões" };

export default async function EstudarPage() {
  const [user, header, navItems, navStyle] = await Promise.all([getUsuario(), getHeader(), getNavItems(), getNavStyle()]);
  if (!user) redirect("/entrar?next=/estudar");

  return (
    <div className="min-h-screen bg-[#0f1420] text-white">
      <header data-typo="header" className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1420]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-6 py-4 lg:flex-row lg:justify-between lg:gap-0">
          <Link href="/" className="flex items-center gap-3">
            <SiteLogo header={header} variant="sm" />
            <div>
              {header.name && <p className="text-2xl font-bold tracking-tight text-white">{header.name}</p>}
              {headerSubtitleLines(header)[0] && <p className="text-xs font-semibold text-accent leading-tight">{headerSubtitleLines(header)[0]}</p>}
            </div>
          </Link>
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/estudar" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/estudar" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent"><Brain className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Questões & revisão</h1>
            <p className="text-xs text-white/45">Pratique e revise com repetição espaçada — o método que fixa o conhecimento.</p>
          </div>
        </div>
        <EstudoSession />
      </main>
    </div>
  );
}
