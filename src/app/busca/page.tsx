export const dynamic = "force-dynamic";

import { Search, ArrowUpRight } from "lucide-react";
import { getHeader } from "@/lib/content";
import { buscarTudo } from "@/lib/search";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import SiteLogo from "@/components/SiteLogo";
import AuthButton from "@/components/AuthButton";
import SearchButton from "@/components/SearchButton";
import AssistenteButton from "@/components/AssistenteButton";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Busca" };

const TIPO_COR: Record<string, string> = {
  "Protocolo": "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  "Procedimento": "border-sky-400/30 bg-sky-400/10 text-sky-300",
  "Curso": "border-violet-400/30 bg-violet-400/10 text-violet-300",
  "Videoaula": "border-rose-400/30 bg-rose-400/10 text-rose-300",
  "Boletim clínico": "border-accent/30 bg-accent/10 text-accent",
  "Atualização": "border-accent/30 bg-accent/10 text-accent",
  "Evento": "border-amber-400/30 bg-amber-400/10 text-amber-300",
  "Podcast": "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300",
  "Outros assuntos": "border-white/20 bg-white/[0.05] text-white/70",
};

export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, header] = await Promise.all([searchParams, getHeader()]);
  const termo = (q || "").trim();
  const resultados = termo ? await buscarTudo(termo) : [];

  // Log de demanda p/ o agente de melhoria (fire-and-forget; não bloqueia a página).
  if (termo.length >= 2 && serviceConfigured()) {
    try { createServiceClient().from("search_queries").insert({ termo: termo.slice(0, 200), resultados: resultados.length }).then(() => {}, () => {}); } catch {}
  }

  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090f]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-4">
          <a href="/" className="flex items-center gap-3">
            <SiteLogo header={header} variant="sm" />
            {header.name && <p className="hidden text-lg font-bold tracking-tight text-white sm:block">{header.name}</p>}
          </a>
          <AssistenteButton /><SearchButton /><AuthButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="mb-1 text-3xl font-semibold tracking-tight">Buscar no portal</h1>
        <p className="mb-6 text-sm text-white/50">Protocolos, procedimentos, cursos, videoaulas, atualizações, eventos e mais.</p>

        <form action="/busca" method="get" className="relative mb-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            name="q"
            defaultValue={termo}
            autoFocus
            placeholder="Ex.: sepse, via aérea, anestesia regional…"
            className="w-full rounded-2xl border border-white/15 bg-black/30 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
        </form>

        {termo && (
          <p className="mb-4 text-xs uppercase tracking-[0.14em] text-white/40">
            {resultados.length} resultado{resultados.length === 1 ? "" : "s"} para “{termo}”
          </p>
        )}

        {termo && resultados.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center text-sm text-white/50">
            Nada encontrado. Tente outra palavra (ex.: “PCR”, “delirium”, “ventilação”).
          </div>
        )}

        <div className="space-y-2">
          {resultados.map((r, i) => {
            const externo = r.href.startsWith("http");
            return (
              <a
                key={i}
                href={r.href}
                target={externo ? "_blank" : undefined}
                rel={externo ? "noopener noreferrer" : undefined}
                className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-accent/40"
              >
                <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIPO_COR[r.tipo] ?? "border-white/15 text-white/50"}`}>{r.tipo}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-white">{r.titulo}</p>
                  {r.descricao && <p className="mt-0.5 line-clamp-2 text-xs text-white/50">{r.descricao}</p>}
                </div>
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-white/30 transition group-hover:text-accent" />
              </a>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
