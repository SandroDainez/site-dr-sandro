import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ZONAS } from "@/lib/zonas";

// Entrada das 6 zonas na home — a "porta da frente" da nova estrutura. Grade de cards,
// cada um com a cor da zona. Some quando a navegação por zonas virar padrão pleno.
export default function ZonasEntrada() {
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Comece por aqui</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">O que você quer fazer agora?</h2>
        <p className="mt-1 text-sm text-white/55">Escolha um caminho — e filtre pela sua especialidade dentro de cada um.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ZONAS.map((z) => (
          <Link
            key={z.slug}
            href={z.href}
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/25 hover:bg-white/[0.05]"
            style={{ borderLeft: `3px solid ${z.cor}` }}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: z.cor }} />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-white">{z.label}</p>
              <p className="text-[13px] text-white/50">{z.papel}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/35 transition group-hover:translate-x-1 group-hover:text-white/70" />
          </Link>
        ))}
      </div>
    </div>
  );
}
