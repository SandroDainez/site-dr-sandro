export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/supabase/auth-server";
import { getHeader } from "@/lib/content";
import EntrarForm from "./EntrarForm";

export const metadata = { title: "Entrar" };

export default async function EntrarPage() {
  const [user, header] = await Promise.all([getUsuario(), getHeader()]);
  if (user) redirect("/minha-area");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07090f] px-6 py-16 text-white">
      <div className="w-full max-w-md">
        <a href="/" className="mb-8 flex items-center justify-center gap-1 text-sm text-white/50 transition hover:text-white">← Início</a>
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{header.name || "Portal Médico"}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Acesse sua conta</h1>
            <p className="mt-1 text-sm text-white/50">Acompanhe cursos, salve conteúdos e receba as atualizações.</p>
          </div>
          <EntrarForm />
        </div>
        <p className="mt-6 text-center text-xs text-white/35">Seus dados ficam protegidos. Login exclusivo para profissionais.</p>
      </div>
    </div>
  );
}
