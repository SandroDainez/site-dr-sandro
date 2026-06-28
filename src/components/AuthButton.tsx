import { getUsuario } from "@/lib/supabase/auth-server";
import { UserCircle } from "lucide-react";

// Botão de conta no cabeçalho: "Entrar" (deslogado) ou "Minha área" (logado).
// Server component — lê a sessão. Some nada: sempre mostra algo clicável.
export default async function AuthButton() {
  const user = await getUsuario();
  const logado = !!user;
  return (
    <a
      href={logado ? "/minha-area" : "/entrar"}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
        logado
          ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
          : "border-white/15 bg-white/[0.04] text-white hover:border-accent/50 hover:text-accent"
      }`}
    >
      <UserCircle className="h-4 w-4" /> {logado ? "Minha área" : "Entrar"}
    </a>
  );
}
