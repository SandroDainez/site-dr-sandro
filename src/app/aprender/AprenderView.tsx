"use client";

import { useMemo, useState } from "react";
import { GraduationCap, PlayCircle, FlaskConical, Users, BookOpen } from "lucide-react";
import type { CursoData, VideoaulaData, ColaboradorData } from "@/lib/content";
import type { AulaPublicaResumo } from "@/lib/aulas-editora";
import type { CientificoPublicoResumo } from "@/lib/cientifico-editora";
import FiltroArea from "@/components/zonas/FiltroArea";
import SecaoConteudo from "@/components/zonas/SecaoConteudo";
import type { ItemConteudo } from "@/components/zonas/ConteudoCard";
import { itemNaArea, type AreaFiltro } from "@/lib/zonas";

const COR = "#5b9dff";

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
    () =>
      cursos
        .map((c) => ({ id: c.id, titulo: c.titulo, href: `/cursos/${c.id}`, tipo: "Curso", area: c.area, areas: c.areas }))
        .filter((item) => itemNaArea(item, area)),
    [cursos, area],
  );

  const aulasItens = useMemo<ItemConteudo[]>(
    () =>
      aulas
        .map((a) => ({ id: a.id, titulo: a.title, href: `/aulas/${a.slug}`, tipo: "Aula", area: a.specialty, areas: a.areas }))
        .filter((item) => itemNaArea(item, area)),
    [aulas, area],
  );

  const videoaulasItens = useMemo<ItemConteudo[]>(
    () =>
      videoaulas
        .map((v) => ({ id: v.id, titulo: v.titulo, href: "/videoaulas", tipo: "Videoaula", area: v.area, areas: v.areas }))
        .filter((item) => itemNaArea(item, area)),
    [videoaulas, area],
  );

  const cientificosItens = useMemo<ItemConteudo[]>(
    () =>
      cientificos
        .map((c) => ({ id: c.id, titulo: c.title, href: `/biblioteca-cientifica/${c.slug}`, tipo: "Texto científico", area: c.specialty, areas: c.areas }))
        .filter((item) => itemNaArea(item, area)),
    [cientificos, area],
  );

  const colaboradoresItens = useMemo<ItemConteudo[]>(
    () =>
      colaboradores
        .map((c) => ({ id: c.id, titulo: c.titulo, href: "/colaboradores", tipo: "Convidado", area: c.area, areas: c.areas }))
        .filter((item) => itemNaArea(item, area)),
    [colaboradores, area],
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: COR }}>🔵 Aprender · formação</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Estude com calma, do jeito certo</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">Cursos, mini-aulas, videoaulas e biblioteca científica — para construir base sólida, no seu tempo.</p>
        </div>
      </div>

      <FiltroArea value={area} onChange={setArea} />

      <SecaoConteudo
        icon={GraduationCap}
        titulo="Cursos"
        sub="Trilhas completas, do básico ao avançado."
        itens={cursosItens}
        cor={COR}
        emBreve="Nenhum curso nesta área ainda — chega em breve."
      />

      <SecaoConteudo
        icon={BookOpen}
        titulo="Mini-aulas"
        sub="Temas objetivos para revisar rápido."
        itens={aulasItens}
        cor={COR}
        emBreve="Nenhuma mini-aula nesta área ainda — chega em breve."
      />

      <SecaoConteudo
        icon={PlayCircle}
        titulo="Videoaulas"
        sub="Aulas em vídeo para assistir com calma."
        itens={videoaulasItens}
        cor={COR}
        emBreve="Nenhuma videoaula nesta área ainda — chega em breve."
      />

      <SecaoConteudo
        icon={FlaskConical}
        titulo="Biblioteca científica"
        sub="Textos e revisões com base na evidência."
        itens={cientificosItens}
        cor={COR}
        emBreve="Nenhum texto científico nesta área ainda — chega em breve."
      />

      <SecaoConteudo
        icon={Users}
        titulo="Convidados"
        sub="Aulas cedidas por outros profissionais."
        itens={colaboradoresItens}
        cor={COR}
        emBreve="Nenhum convidado nesta área ainda — chega em breve."
      />
    </div>
  );
}
