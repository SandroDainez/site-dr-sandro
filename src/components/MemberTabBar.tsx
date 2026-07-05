"use client";

import { usePathname } from "next/navigation";
import { Home, GraduationCap, Brain, Sparkles, User } from "lucide-react";

const TABS = [
  { href: "/minha-area", label: "Início", icon: Home },
  { href: "/cursos", label: "Cursos", icon: GraduationCap },
  { href: "/estudar", label: "Questões", icon: Brain },
  { href: "/assistente", label: "Assistente", icon: Sparkles },
  { href: "/minha-area#perfil", label: "Perfil", icon: User },
];

// Barra inferior tipo app — aparece só no celular (lg:hidden) e para quem está logado.
// Dá a sensação de aplicativo: o aluno navega o conteúdo dele direto.
export default function MemberTabBar() {
  const pathname = usePathname();
  return (
    <>
      <div className="h-[68px] lg:hidden" aria-hidden />
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0f1420]/95 backdrop-blur-xl lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {TABS.map((t) => {
            const base = t.href.split("#")[0];
            const ativo = pathname === base || (base !== "/minha-area" && pathname.startsWith(base));
            const Icon = t.icon;
            return (
              <a key={t.href} href={t.href} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition ${ativo ? "text-accent" : "text-white/50"}`}>
                <Icon className="h-5 w-5" />
                {t.label}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
