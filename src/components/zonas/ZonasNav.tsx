import Link from "next/link";
import { ZONAS, type ZonaSlug } from "@/lib/zonas";

// Navegação das 6 zonas (Plantão · Aprender · Atualizar · Treinar · Aberto · Meu).
// Componente puro (sem estado) — a zona ativa vem por prop. Usado no topo de cada zona.
export default function ZonasNav({ ativa }: { ativa: ZonaSlug }) {
  return (
    <nav aria-label="Zonas" className="border-b border-white/10 bg-[#0b0f18]">
      <div className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 py-2">
        {ZONAS.map((z) => {
          const on = z.slug === ativa;
          return (
            <Link
              key={z.slug}
              href={z.href}
              aria-current={on ? "true" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                on ? "bg-white/[0.06] text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: z.cor, opacity: on ? 1 : 0.55, boxShadow: on ? `0 0 0 3px ${z.cor}33` : undefined }}
              />
              {z.label}
              {on && <span className="hidden text-[11px] font-normal text-white/40 sm:inline">· {z.papel}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
