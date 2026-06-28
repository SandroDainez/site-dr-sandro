export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getUsuario, createAuthClient } from "@/lib/supabase/auth-server";
import { sair } from "@/app/entrar/actions";
import { BookOpen, Bookmark, GraduationCap, LogOut } from "lucide-react";
import PerfilForm from "./PerfilForm";

export const metadata = { title: "Minha área" };

export default async function MinhaAreaPage() {
  const user = await getUsuario();
  if (!user) redirect("/entrar?next=/minha-area");

  let perfil: { nome?: string; especialidade?: string; crm?: string } = {};
  try {
    const supabase = await createAuthClient();
    const { data } = await supabase.from("profiles").select("nome,especialidade,crm").eq("id", user.id).maybeSingle();
    if (data) perfil = data;
  } catch { /* perfil vazio */ }

  const primeiroNome = (perfil.nome || user.email || "").split(" ")[0] || "médico(a)";

  return (
    <div className="min-h-screen bg-[#07090f] px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <a href="/" className="text-xs text-white/45 transition hover:text-white">← Início</a>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Olá, {primeiroNome}</h1>
            <p className="mt-1 text-sm text-white/50">{user.email}</p>
          </div>
          <form action={sair}>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-red-400/40 hover:text-red-300">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </form>
        </div>

        {/* Próximas fases: progresso e salvos (placeholders já visíveis) */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-2 flex items-center gap-2 text-accent"><GraduationCap className="h-5 w-5" /><h2 className="text-sm font-semibold text-white">Meus cursos</h2></div>
            <p className="text-sm text-white/45">Seu progresso nos cursos vai aparecer aqui. (em construção)</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-2 flex items-center gap-2 text-accent"><Bookmark className="h-5 w-5" /><h2 className="text-sm font-semibold text-white">Salvos</h2></div>
            <p className="text-sm text-white/45">Protocolos, atualizações e materiais que você salvar. (em construção)</p>
          </div>
        </div>

        {/* Perfil */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent" /><h2 className="text-base font-semibold text-white">Meu perfil</h2></div>
          <PerfilForm perfil={perfil} />
        </div>
      </div>
    </div>
  );
}
