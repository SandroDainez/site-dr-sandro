export const dynamic = "force-dynamic";

import { getAtualizacoes, getHeader } from "@/lib/content";
import AtualizacoesGrid from "./AtualizacoesGrid";
import Image from "next/image";

export default async function AtualizacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const [atualizacoes, header, params] = await Promise.all([getAtualizacoes(), getHeader(), searchParams]);
  const initialArea = params.area ?? "todas";

  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      {/* Site header — identical style to home page */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-6 py-4 lg:flex-row lg:justify-between lg:gap-0">
          {/* Logo + name */}
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-black/10 shadow-[0_0_24px_rgba(44,230,184,0.25)]">
              <Image
                src={header.logoUrl}
                alt="Logo"
                width={96}
                height={96}
                className="h-full w-full object-cover scale-150"
                unoptimized
              />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-white">{header.name}</p>
              <p className="text-xs font-semibold text-accent leading-tight">{header.cremesp}</p>
            </div>
          </a>

          {/* Nav */}
          <nav className="hidden items-center gap-3 rounded-full border border-white/10 bg-black/75 px-3 py-2 text-sm text-white/70 backdrop-blur-md lg:flex">
            <a href="/#apps-assinatura" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">Apps Assinatura</a>
            <a href="/#apps-gratis" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">Apps Grátis</a>
            <a href="/#cursos" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">Cursos</a>
            <a href="/#eventos" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">Eventos</a>
            <a href="/atualizacoes" className="rounded-full px-3 py-1.5 bg-white/10 text-white font-medium">Atualizações</a>
            <a href="/protocolos" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">Protocolos</a>
            <a href="/#contato" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">Contato</a>
          </nav>

          {/* Mobile back */}
          <a
            href="/"
            className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white lg:hidden"
          >
            ← Início
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Conteúdo clínico</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">Atualizações</h1>
          <p className="mt-3 text-base text-white/50">
            Revisão rápida e direto ao ponto da evidência mais recente, por área clínica.
          </p>
          {/* Selos: revisão rápida + atualização semanal */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent">
              ⚡ Revisão rápida
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-blue/30 bg-accent-blue/10 px-3.5 py-1.5 text-xs font-semibold text-accent-blue">
              🔄 Atualizada semanalmente
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/70">
              📈 Baseada em evidência recente
            </span>
          </div>
        </div>

        <AtualizacoesGrid atualizacoes={atualizacoes} initialArea={initialArea} />
      </main>

      <footer className="border-t border-white/10 bg-black/20 py-8">
        <div className="mx-auto w-full max-w-7xl px-6 flex items-center justify-between text-sm text-white/40">
          <a href="/" className="transition hover:text-white">← Início</a>
          <a href="/protocolos" className="transition hover:text-white">Protocolos →</a>
        </div>
      </footer>
    </div>
  );
}
