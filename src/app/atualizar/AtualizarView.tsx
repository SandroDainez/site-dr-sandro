"use client";

import { useMemo } from "react";
import { Newspaper, RefreshCw, Search, GitCompare, FileText } from "lucide-react";
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

      {/* Boletins semanais da IA — 1 por área, o mais recente. Semanas anteriores no histórico.
          SEPARADO dos destaques manuais para não misturar os dois tipos de conteúdo. */}
      <section>
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Newspaper className="h-5 w-5" style={{ color: COR }} /> Boletins da semana
          </h2>
          <p className="mt-0.5 text-[13px] text-white/45">Resumo clínico automático por área, com a fonte. As semanas anteriores ficam no histórico.</p>
        </div>
        <AtualizacoesFeed ai={aiBoletins} manuais={[]} controlledArea={areaZonaParaFeed(area)} />
      </section>

      {/* Destaques clínicos — atualizações selecionadas MANUALMENTE (estudos, diretrizes).
          Só aparece se houver alguma; não se mistura com os boletins automáticos. */}
      {atualizacoes.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <FileText className="h-5 w-5" style={{ color: COR }} /> Destaques clínicos
            </h2>
            <p className="mt-0.5 text-[13px] text-white/45">Estudos e atualizações selecionados a dedo pela equipe.</p>
          </div>
          <AtualizacoesFeed ai={[]} manuais={atualizacoes} controlledArea={areaZonaParaFeed(area)} />
        </section>
      )}

      <SecaoConteudo icon={RefreshCw} titulo="Atualizações de guia terapêutico" sub="O que mudou nas condutas." itens={itensProto} cor={COR} emBreve="Nenhuma atualização de guia nesta área ainda — chega em breve." />

      <SecaoConteudo icon={Search} titulo="Pesquisas" sub="Sínteses de evidência sobre um tema." itens={itensPesquisas} cor={COR} emBreve="Nenhuma pesquisa nesta área ainda — chega em breve." />

      <SecaoConteudo icon={GitCompare} titulo="Comparativos de diretrizes" sub="Onde as diretrizes concordam e divergem." itens={itensComparativos} cor={COR} emBreve="Nenhum comparativo nesta área ainda — chega em breve." />

      <SecaoConteudo icon={FileText} titulo="Artigos" sub="Textos autorais e revisões." itens={itensArtigos} cor={COR} emBreve="Nenhum artigo nesta área ainda — chega em breve." />

      {/* A agenda de eventos (calendário aberto) é renderizada pela página logo abaixo —
          é server component (busca no Supabase), não cabe dentro deste client component. */}
    </div>
  );
}
