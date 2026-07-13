"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { GraduationCap, PlayCircle, FlaskConical, Users, BookOpen } from "lucide-react";
import type { CursoData, VideoaulaData, ColaboradorData } from "@/lib/content";
import type { AulaPublicaResumo } from "@/lib/aulas-editora";
import type { CientificoPublicoResumo } from "@/lib/cientifico-editora";
import FiltroArea from "@/components/zonas/FiltroArea";
import SecaoConteudo from "@/components/zonas/SecaoConteudo";
import EmBreve from "@/components/zonas/EmBreve";
import type { ItemConteudo } from "@/components/zonas/ConteudoCard";
import { itemNaArea, areaDoTexto, type AreaFiltro } from "@/lib/zonas";
import { VideoCard } from "@/app/videoaulas/VideoaulasGrid";
import ColaboradoresList from "@/app/colaboradores/ColaboradoresList";

const COR = "#5b9dff";

// Cabeçalho de seção (para os tipos que usam card RICO próprio — videoaulas e convidados —
// em vez do card genérico do SecaoConteudo).
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

type Props = {
  cursos: CursoData[];
  aulas: AulaPublicaResumo[];
  videoaulas: VideoaulaData[];
  cientificos: CientificoPublicoResumo[];
  colaboradores: ColaboradorData[];
};

export default function AprenderView({ cursos, aulas, videoaulas, cientificos, colaboradores }: Props) {
  const [area, setArea] = useState<AreaFiltro>("todos");

  const cursosItens = useMemo<ItemConteudo[]>(
    () => cursos.map((c) => ({ id: c.id, titulo: c.titulo, href: `/cursos/${c.id}`, tipo: "Curso", area: c.area, areas: c.areas })).filter((item) => itemNaArea(item, area)),
    [cursos, area],
  );
  const aulasItens = useMemo<ItemConteudo[]>(
    () => aulas.map((a) => ({ id: a.id, titulo: a.title, href: `/aulas/${a.slug}`, tipo: "Aula", area: a.specialty, areas: a.areas })).filter((item) => itemNaArea(item, area)),
    [aulas, area],
  );
  const cientificosItens = useMemo<ItemConteudo[]>(
    () => cientificos.map((c) => ({ id: c.id, titulo: c.title, href: `/biblioteca-cientifica/${c.slug}`, tipo: "Texto científico", area: c.specialty, areas: c.areas })).filter((item) => itemNaArea(item, area)),
    [cientificos, area],
  );

  // Tipos com card RICO próprio — filtra os dados crus e reusa o componente original.
  const videoaulasFiltradas = useMemo(() => videoaulas.filter((v) => itemNaArea(v, area)), [videoaulas, area]);
  // Convidados: se "Área no site" não foi preenchida, deduz da credencial (especialidade).
  const colaboradoresFiltrados = useMemo(
    () => colaboradores.filter((c) => {
      const areaEfetiva = c.area && c.area !== "geral" ? c.area : areaDoTexto(c.especialidade);
      return itemNaArea({ area: areaEfetiva, areas: c.areas }, area);
    }),
    [colaboradores, area],
  );

  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: COR }}>🔵 Aprender · formação</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Estude com calma, do jeito certo</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">Cursos, mini-aulas, videoaulas e biblioteca científica — para construir base sólida, no seu tempo.</p>
      </div>

      <FiltroArea value={area} onChange={setArea} />

      <SecaoConteudo icon={GraduationCap} titulo="Cursos" sub="Trilhas completas, do básico ao avançado." itens={cursosItens} cor={COR} emBreve="Nenhum curso nesta área ainda — chega em breve." />

      <SecaoConteudo icon={BookOpen} titulo="Mini-aulas" sub="Temas objetivos para revisar rápido." itens={aulasItens} cor={COR} emBreve="Nenhuma mini-aula nesta área ainda — chega em breve." />

      {/* Videoaulas — card RICO reusado (thumbnail, play, PDF, teste de conhecimento) */}
      <section>
        <SecaoHead icon={PlayCircle} titulo="Videoaulas" sub="Aulas em vídeo para assistir com calma." />
        {videoaulasFiltradas.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videoaulasFiltradas.map((v) => <VideoCard key={v.id} item={v} />)}
          </div>
        ) : (
          <EmBreve texto="Nenhuma videoaula nesta área ainda — chega em breve." />
        )}
      </section>

      <SecaoConteudo icon={FlaskConical} titulo="Biblioteca científica" sub="Textos e revisões com base na evidência." itens={cientificosItens} cor={COR} emBreve="Nenhum texto científico nesta área ainda — chega em breve." />

      {/* Convidados — card RICO reusado (agrupa aulas do mesmo assunto numa playlist) */}
      <section>
        <SecaoHead icon={Users} titulo="Convidados" sub="Aulas cedidas por outros profissionais." />
        {colaboradoresFiltrados.length > 0 ? (
          <ColaboradoresList items={colaboradoresFiltrados} />
        ) : (
          <EmBreve texto="Nenhum convidado nesta área ainda — chega em breve." />
        )}
      </section>
    </div>
  );
}
