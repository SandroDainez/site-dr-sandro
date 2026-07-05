"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, PlayCircle, ArrowRight } from "lucide-react";
import type { CursoData } from "@/lib/content";
import { colStyle } from "@/lib/card-grid";

type FilterArea = "todos" | CursoData["area"];

const tabs: { value: FilterArea; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "emergencias", label: "Emergências" },
  { value: "ti", label: "Terapia Intensiva" },
  { value: "anestesiologia", label: "Anestesiologia" },
  { value: "geral", label: "Geral" },
];

const areaBadge: Record<CursoData["area"], string> = {
  emergencias: "bg-emerg/15 text-emerg border-emerg/30",
  ti: "bg-inten/15 text-inten border-inten/30",
  anestesiologia: "bg-anest/15 text-anest border-anest/30",
  geral: "bg-teal-400/15 text-teal-400 border-teal-400/30",
};

const areaLabel: Record<CursoData["area"], string> = {
  emergencias: "Emergências",
  ti: "Terapia Intensiva",
  anestesiologia: "Anestesiologia",
  geral: "Geral",
};

const nivelLabel: Record<string, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export default function CursosCatalog({ cursos, cols }: { cursos: CursoData[]; cols?: number }) {
  const [active, setActive] = useState<FilterArea>("todos");

  const visiveis = cursos.filter((c) => c.titulo);
  const filtrados = active === "todos" ? visiveis : visiveis.filter((c) => c.area === active || c.areas?.includes(active as "emergencias" | "ti" | "anestesiologia"));

  if (visiveis.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
        <p className="text-sm text-white/50">Os cursos estão sendo preparados. Em breve, aqui.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActive(tab.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              active === tab.value
                ? "border-accent bg-accent/15 text-accent"
                : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtrados.length === 0 && (
        <p className="text-sm text-white/40">Nenhum curso nesta área ainda.</p>
      )}

      <div className="card-grid gap-5" style={colStyle(cols)}>
        {filtrados.map((curso) => {
          const pago = curso.acesso === "pago";
          return (
            <Link
              key={curso.id}
              href={`/cursos/${curso.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-white/20"
            >
              {/* Capa */}
              <div className="relative aspect-video overflow-hidden bg-black">
                {curso.capaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" decoding="async" src={curso.capaUrl} alt={`Capa do curso `} className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-white/20">
                    <PlayCircle className="h-10 w-10" />
                  </div>
                )}
                <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                  pago ? "border-amber-400/40 bg-amber-400/15 text-amber-300" : "border-green-400/40 bg-green-400/15 text-green-300"
                }`}>
                  {pago ? "🔒 Em breve" : "Gratuito"}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${areaBadge[curso.area]}`}>
                    {areaLabel[curso.area]}
                  </span>
                  {curso.nivel && (
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-white/50">
                      {nivelLabel[curso.nivel]}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-semibold leading-snug text-white">{curso.titulo}</h2>
                {curso.resumo && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50">{curso.resumo}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-white/40">
                    {curso.aulas.length} aula{curso.aulas.length !== 1 ? "s" : ""}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${pago ? "text-amber-300/80" : "text-accent"}`}>
                    {pago ? <><Lock className="h-3 w-3" /> Em breve</> : <>Acessar <ArrowRight className="h-3 w-3" /></>}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
