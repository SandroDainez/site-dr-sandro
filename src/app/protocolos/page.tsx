export const dynamic = "force-dynamic";

import { getProtocolos, getHeader } from "@/lib/content";
import ProtocolosGrid from "./ProtocolosGrid";
import Image from "next/image";

export default async function ProtocolosPage() {
  const [protocolos, header] = await Promise.all([getProtocolos(), getHeader()]);

  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      {/* Simple header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-black/10">
              <Image
                src={header.logoUrl}
                alt="Logo"
                width={40}
                height={40}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <p className="text-sm font-semibold text-white">{header.name}</p>
          </div>
          <a
            href="/"
            className="rounded-full border border-white/15 bg-white/[0.03] px-4 py-1.5 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
          >
            ← Site
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        {/* Page header */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Condutas clínicas</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">
            Protocolos Clínicos
          </h1>
          <p className="mt-3 text-base text-white/50">
            Algoritmos e condutas por área
          </p>
        </div>

        <ProtocolosGrid protocolos={protocolos} />
      </main>

      <footer className="border-t border-white/10 bg-black/20 py-8">
        <div className="mx-auto w-full max-w-7xl px-6 text-sm text-white/40">
          <a href="/" className="transition hover:text-white">
            ← Voltar ao site
          </a>
        </div>
      </footer>
    </div>
  );
}
