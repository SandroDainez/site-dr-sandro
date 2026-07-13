"use client";

import { useMemo } from "react";
import { Mic, MessageSquare, Sparkles, Link as LinkIcon, type LucideIcon } from "lucide-react";
import type { PodcastData } from "@/lib/content";
import FiltroArea from "@/components/zonas/FiltroArea";
import { useAreaFiltro } from "@/components/zonas/useAreaFiltro";
import SecaoConteudo from "@/components/zonas/SecaoConteudo";
import EmBreve from "@/components/zonas/EmBreve";
import { itemNaArea } from "@/lib/zonas";

const COR = "#ff9d4d";

type Props = {
  podcasts: PodcastData[];
};

function SecaoHead({ icon: Icon, titulo, sub }: { icon: LucideIcon; titulo: string; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Icon className="h-5 w-5" style={{ color: COR }} /> {titulo}
      </h2>
      <p className="mt-0.5 text-[13px] text-white/45">{sub}</p>
    </div>
  );
}

export default function AbertoView({ podcasts }: Props) {
  const [area, setArea] = useAreaFiltro();

  const episodios = useMemo(
    () =>
      podcasts
        .filter((p) => itemNaArea(p, area))
        .map((p) => ({
          id: p.id,
          titulo: p.titulo,
          href: "/podcast",
          tipo: "Podcast",
          area: p.area,
          areas: p.areas,
        })),
    [podcasts, area],
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: COR }}>🟠 Extras · além da clínica</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Um respiro além da beira do leito</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">Podcast, entrevistas, curiosidades, links úteis e dicas de IA — o lado leve e curioso da medicina.</p>
        </div>
      </div>

      <FiltroArea value={area} onChange={setArea} />

      {/* Podcast e entrevistas */}
      <SecaoConteudo
        icon={Mic}
        titulo="Podcast e entrevistas"
        sub="Conversas, casos e convidados — pra ouvir com calma."
        itens={episodios}
        cor={COR}
        emBreve="Nenhum episódio nesta área ainda — chega em breve."
      />

      {/* Curiosidades — ainda sem conteúdo (regra: nunca inventar) */}
      <section>
        <SecaoHead icon={MessageSquare} titulo="Curiosidades" sub="Casos comentados e curiosidades da medicina." />
        <EmBreve texto="Curiosidades e casos comentados chegam em breve." />
      </section>

      {/* Links úteis — ainda sem conteúdo */}
      <section>
        <SecaoHead icon={LinkIcon} titulo="Links úteis" sub="Uma coletânea de referências e ferramentas." />
        <EmBreve texto="Uma coletânea de links úteis chega em breve." />
      </section>

      {/* Dicas de IA — ainda sem conteúdo */}
      <section>
        <SecaoHead icon={Sparkles} titulo="Dicas de IA" sub="Como usar IA na prática médica, sem enrolação." />
        <EmBreve texto="Dicas de como usar IA na prática médica chegam em breve." />
      </section>
    </div>
  );
}
