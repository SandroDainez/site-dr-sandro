"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Botão "Voltar" da barra fixa: volta para a página anterior (histórico do navegador).
// Some na home (não faz sentido) e quando não há de onde voltar (entrada direta).
export default function NavBack({ currentPath, className }: { currentPath?: string; className?: string }) {
  const router = useRouter();

  // Não mostra na home. Em entrada direta (sem histórico no app) o "voltar" pode sair do
  // site — então só exibimos quando há histórico para voltar.
  if (currentPath === "/") return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Voltar para a página anterior"
      className={
        className ??
        "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-white/80 transition hover:border-accent/40 hover:text-white"
      }
    >
      <ArrowLeft className="h-4 w-4" /> Voltar
    </button>
  );
}
