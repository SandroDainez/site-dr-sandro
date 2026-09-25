export const dynamic = "force-dynamic";

import Link from "next/link";
import { getUsuario, createAuthClient } from "@/lib/supabase/auth-server";
import { getHeader, getNavItems, getNavStyle, headerSubtitleLines } from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import SiteNav from "@/components/SiteNav";
import MobileNav from "@/components/MobileNav";
import { Sparkles, Lock } from "lucide-react";
import AssistenteChat from "./AssistenteChat";

export const metadata = { title: "Assistente clínico" };

export default async function AssistentePage() {
  const [user, header, navItems, navStyle] = await Promise.all([
    getUsuario(), getHeader(), getNavItems(), getNavStyle(),
  ]);

  // Gate de ASSINANTE: por ora o assistente só está liberado para assinantes
  // (profiles.liberado) — o mesmo gate que a API já aplica. Ele aparece no menu,
  // mas quem não é assinante (deslogado ou logado sem liberação) vê um aviso, não o chat.
  // Não mexe em consumo/quota: é só controle de ACESSO à tela.
  let liberado = false;
  if (user) {
    try {
      const supabase = await createAuthClient();
      const { data: perfil } = await supabase.from("profiles").select("liberado").eq("id", user.id).maybeSingle();
      liberado = !!perfil?.liberado;
    } catch { /* trata como não liberado */ }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0f1420] text-white">
      <header data-typo="header" className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1420]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-6 py-4 lg:flex-row lg:justify-between lg:gap-0">
          <Link href="/" className="flex items-center gap-3">
            <SiteLogo header={header} variant="sm" />
            <div>
              {header.name && <p className="text-2xl font-bold tracking-tight text-white">{header.name}</p>}
              {headerSubtitleLines(header)[0] && <p className="text-xs font-semibold text-accent leading-tight">{headerSubtitleLines(header)[0]}</p>}
            </div>
          </Link>
          <div className="flex items-center gap-2"><SiteNav items={navItems} style={navStyle} internal currentPath="/assistente" /><AssistenteButton /><SearchButton /><AuthButton /></div>
          <MobileNav items={navItems} style={navStyle} internal currentPath="/assistente" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-6 min-h-0">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent"><Sparkles className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Assistente clínico</h1>
            <p className="text-xs text-white/45">Responde com base no conteúdo curado do portal, com fonte rastreável.</p>
          </div>
        </div>

        {liberado ? (
          <AssistenteChat />
        ) : (
          <div className="mt-2 flex flex-1 items-start justify-center">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">Ferramenta de uso para assinantes</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                O Assistente clínico está disponível para <strong className="text-white/80">assinantes</strong> do
                MedCampus. {user
                  ? "Sua conta ainda não tem acesso liberado."
                  : "Entre na sua conta de assinante para usar."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {!user && (
                  <Link href="/entrar?next=/assistente" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-[#0f1420] transition hover:opacity-90">
                    Entrar
                  </Link>
                )}
                <Link href="/" className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/70 transition hover:text-white">
                  Voltar ao início
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
