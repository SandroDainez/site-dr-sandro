"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Newspaper, RefreshCw, Search, GitCompare, FileText, CalendarDays, ArrowRight } from "lucide-react";
import type { AtualizacaoData } from "@/lib/content";
import type { AtualizacaoResumo } from "@/lib/atualizacoes-editora";
import type { ResearchResumo } from "@/lib/research-editora";
import type { Artigo } from "@/lib/editora";
import SecaoConteudo from "@/components/zonas/SecaoConteudo";
import FiltroArea from "@/components/zonas/FiltroArea";
import { useAreaFiltro } from "@/components/zonas/useAreaFiltro";
import type { ItemConteudo } from "@/components/zonas/ConteudoCard";
import { itemNaArea } from "@/lib/zonas";
import AtualizacoesFeed from "@/components/AtualizacoesFeed";

const COR = "#b98af0";

// Filtro da zona ("todos"|área) → área do feed de atualizações ("todas"|área).
const areaZonaParaFeed = (a: string): string => (a === "todos" ? "todas" : a);

type Props = {
  atualizacoes: AtualizacaoData[];
  aiBoletins: Record<string, unknown>[];
  atualizacoesProto: AtualizacaoResumo[];
  pesquisas: ResearchResumo[];
  comparativos: ResearchResumo[];
  artigos: Artigo[];
};

export default function AtualizarView({ atualizacoes, aiBoletins, atualizacoesProto, pesquisas, comparativos, artigos }: Props) {
  const [area, setArea] = useAreaFiltro();

  const itensProto: ItemConteudo[] = useMemo(
    () =>
      atualizacoesProto
        .map((a): ItemConteudo => ({ id: a.id, titulo: a.title, href: `/atualizacoes-protocolos/${a.slug}`, tipo: "Delta de protocolo", area: a.specialty, areas: a.areas }))
        .filter((i) => itemNaArea(i, area)),
    [atualizacoesProto, area],
  );

  const itensPesquisas: ItemConteudo[] = useMemo(
    () =>
      pesquisas
        .map((p): ItemConteudo => ({ id: p.id, titulo: p.title, href: `/pesquisas/${p.slug}`, tipo: "Pesquisa", area: p.specialty, areas: p.areas }))
        .filter((i) => itemNaArea(i, area)),
    [pesquisas, area],
  );

  const itensComparativos: ItemConteudo[] = useMemo(
    () =>
      comparativos
        .map((c): ItemConteudo => ({ id: c.id, titulo: c.title, href: `/comparativos/${c.slug}`, tipo: "Comparativo", area: c.specialty, areas: c.areas }))
        .filter((i) => itemNaArea(i, area)),
    [comparativos, area],
  );

  const itensArtigos: ItemConteudo[] = useMemo(
    () =>
      artigos
        .map((a): ItemConteudo => ({ id: a.id, titulo: a.titulo, href: `/artigos/${a.slug}`, tipo: "Artigo", area: a.especialidade }))
        .filter((i) => itemNaArea(i, area)),
    [artigos, area],
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: COR }}>🟣 Atualizar · o que há de novo</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">O que mudou, e o que vem por aí</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">Atualizações clínicas, deltas de protocolo, pesquisas, comparativos de diretrizes e artigos — o que há de novo na sua área.</p>
        </div>
      </div>

      <FiltroArea value={area} onChange={setArea} />

      {/* Atualizações clínicas: boletins semanais da IA + manuais, no mesmo feed da
          página /atualizacoes. "Geral" mostra a semana mais recente de cada área;
          numa área específica, só a dela. Semanas passadas ficam no histórico. */}
      <section>
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Newspaper className="h-5 w-5" style={{ color: COR }} /> Atualizações clínicas
          </h2>
          <p className="mt-0.5 text-[13px] text-white/45">O que há de novo na prática, com a fonte. As semanas anteriores ficam no histórico.</p>
        </div>
        <AtualizacoesFeed ai={aiBoletins} manuais={atualizacoes} controlledArea={areaZonaParaFeed(area)} />
      </section>

      <SecaoConteudo icon={RefreshCw} titulo="Atualizações de protocolo" sub="O que mudou nas condutas institucionais." itens={itensProto} cor={COR} emBreve="Nenhuma atualização de protocolo nesta área ainda — chega em breve." />

      <SecaoConteudo icon={Search} titulo="Pesquisas" sub="Sínteses de evidência sobre um tema." itens={itensPesquisas} cor={COR} emBreve="Nenhuma pesquisa nesta área ainda — chega em breve." />

      <SecaoConteudo icon={GitCompare} titulo="Comparativos de diretrizes" sub="Onde as diretrizes concordam e divergem." itens={itensComparativos} cor={COR} emBreve="Nenhum comparativo nesta área ainda — chega em breve." />

      <SecaoConteudo icon={FileText} titulo="Artigos" sub="Textos autorais e revisões." itens={itensArtigos} cor={COR} emBreve="Nenhum artigo nesta área ainda — chega em breve." />

      {/* Agenda de eventos — sempre presente (independe de área) */}
      <section>
        <Link
          href="/inscricao"
          className="group flex items-center gap-4 rounded-2xl border border-accent/30 bg-accent/[0.06] p-5 transition hover:border-accent/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent"><CalendarDays className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white">📅 Agenda de eventos científicos</p>
            <p className="text-sm text-white/55">Congressos, simpósios e inscrições.</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-white/70" />
        </Link>
      </section>
    </div>
  );
}
