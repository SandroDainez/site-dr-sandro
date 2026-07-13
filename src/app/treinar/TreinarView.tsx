"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Repeat, ArrowRight, ListChecks, Layers } from "lucide-react";
import type { QuestaoDocResumo } from "@/lib/questoes-editora";
import type { FlashcardPublicoResumo } from "@/lib/flashcards-editora";
import FiltroArea from "@/components/zonas/FiltroArea";
import SecaoConteudo from "@/components/zonas/SecaoConteudo";
import type { ItemConteudo } from "@/components/zonas/ConteudoCard";
import { itemNaArea, type AreaFiltro } from "@/lib/zonas";

const COR = "#2ce6b8";

type Props = {
  questoes: QuestaoDocResumo[];
  flashcards: FlashcardPublicoResumo[];
};

export default function TreinarView({ questoes, flashcards }: Props) {
  const [area, setArea] = useState<AreaFiltro>("todos");

  const questoesItens = useMemo<ItemConteudo[]>(
    () =>
      questoes
        .map((q) => ({
          id: q.id,
          titulo: q.title,
          href: `/questoes/${q.slug}`,
          tipo: "Questões",
          area: q.specialty,
          areas: q.areas,
        }))
        .filter((item) => itemNaArea(item, area)),
    [questoes, area],
  );

  const flashcardsItens = useMemo<ItemConteudo[]>(
    () =>
      flashcards
        .map((f) => ({
          id: f.id,
          titulo: f.title,
          href: `/flashcards/${f.slug}`,
          tipo: "Flashcards",
          area: f.specialty,
          areas: f.areas,
        }))
        .filter((item) => itemNaArea(item, area)),
    [flashcards, area],
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: COR }}>🟢 Treinar · testar-se</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Fixe o que importa, testando-se</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">Questões e flashcards pra checar o que você realmente sabe — e transformar leitura em memória.</p>
        </div>
      </div>

      <FiltroArea value={area} onChange={setArea} />

      {/* Revisão espaçada — sempre presente (independe de área) */}
      <section>
        <Link
          href="/estudar"
          className="group flex items-center gap-4 rounded-2xl border border-accent/30 bg-accent/[0.06] p-5 transition hover:border-accent/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent"><Repeat className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white">Revisão espaçada</p>
            <p className="text-sm text-white/55">Seus cartões na hora certa de revisar (repetição espaçada).</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-white/70" />
        </Link>
      </section>

      <SecaoConteudo
        icon={ListChecks}
        titulo="Questões"
        sub="Teste-se com questões comentadas."
        itens={questoesItens}
        cor={COR}
        emBreve="Nenhuma questão nesta área ainda — chega em breve."
      />

      <SecaoConteudo
        icon={Layers}
        titulo="Flashcards"
        sub="Cartões pra memorizar o essencial."
        itens={flashcardsItens}
        cor={COR}
        emBreve="Nenhum flashcard nesta área ainda — chega em breve."
      />
    </div>
  );
}
