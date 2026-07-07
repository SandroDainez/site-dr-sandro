export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/supabase/auth-server";
import { getHeader } from "@/lib/content";
import SiteLogo from "@/components/SiteLogo";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import { Sparkles } from "lucide-react";
import AssistenteChat from "./AssistenteChat";

export const metadata = { title: "Assistente clínico" };

export default async function AssistentePage() {
  const [user, header] = await Promise.all([getUsuario(), getHeader()]);
  if (!user) redirect("/entrar?next=/assistente");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0f1420] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1420]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-3"><SiteLogo header={header} variant="sm" />{header.name && <p className="hidden text-lg font-bold tracking-tight text-white sm:block">{header.name}</p>}</Link>
          <div className="flex items-center gap-2"><AssistenteButton /><SearchButton /><AuthButton /></div>
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
        <AssistenteChat />
      </main>
    </div>
  );
}
