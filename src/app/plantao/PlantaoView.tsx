"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Sparkles, ClipboardList, Stethoscope, Calculator, ArrowRight } from "lucide-react";
import type { ProtocoloData, AcervoItemData, FreeAppData } from "@/lib/content";
import ProtocoloCard from "@/components/ProtocoloCard";
import FiltroArea from "@/components/zonas/FiltroArea";
import { useAreaFiltro } from "@/components/zonas/useAreaFiltro";
import EmBreve from "@/components/zonas/EmBreve";
import { sanitizeRichText } from "@/lib/rich-text";
import { iconMap } from "@/lib/icon-map";
import { itemNaArea } from "@/lib/zonas";

type Props = {
  protocolos: ProtocoloData[];
  procedimentos: AcervoItemData[];
  calculadoras: FreeAppData[];
};

function SecaoHead({ icon: Icon, titulo, sub }: { icon: typeof ClipboardList; titulo: string; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Icon className="h-5 w-5" style={{ color: "#ff6259" }} /> {titulo}
      </h2>
      <p className="mt-0.5 text-[13px] text-white/45">{sub}</p>
    </div>
  );
}

export default function PlantaoView({ protocolos, procedimentos, calculadoras }: Props) {
  const [area, setArea] = useAreaFiltro();

  const proto = useMemo(() => protocolos.filter((p) => itemNaArea(p, area)), [protocolos, area]);
  const procs = useMemo(() => procedimentos.filter((p) => itemNaArea(p, area) && p.titulo), [procedimentos, area]);
  const calcs = useMemo(() => calculadoras.filter((c) => itemNaArea(c, area) && c.title), [calculadoras, area]);

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "#ff6259" }}>🔴 Plantão · apoio na hora</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Na beira do leito, em segundos</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">Protocolos, procedimentos, calculadoras e o assistente clínico — o que você precisa consultar rápido, sem estudar.</p>
        </div>
      </div>

      <FiltroArea value={area} onChange={setArea} />

      {/* Assistente clínico — sempre presente (independe de área) */}
      <section>
        <Link
          href="/assistente"
          className="group flex items-center gap-4 rounded-2xl border border-accent/30 bg-accent/[0.06] p-5 transition hover:border-accent/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent"><Sparkles className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white">Assistente clínico de IA</p>
            <p className="text-sm text-white/55">Pergunte e receba a resposta com a fonte citada — digitando ou por voz.</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-white/70" />
        </Link>
      </section>

      {/* Protocolos */}
      <section>
        <SecaoHead icon={ClipboardList} titulo="Protocolos" sub="Condutas prontas pra consultar na hora." />
        {proto.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {proto.map((item) => <ProtocoloCard key={item.id} item={item} />)}
          </div>
        ) : (
          <EmBreve texto="Nenhum protocolo nesta área ainda — chega em breve." />
        )}
      </section>

      {/* Procedimentos */}
      <section>
        <SecaoHead icon={Stethoscope} titulo="Procedimentos" sub="Técnicas e passo a passo." />
        {procs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {procs.map((p) => (
              <Link key={p.id} href="/procedimentos" className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20">
                <h3 className="text-base font-semibold leading-snug text-white">{p.titulo}</h3>
                {p.descricao && <p className="mt-2 line-clamp-2 text-sm text-white/55" dangerouslySetInnerHTML={{ __html: sanitizeRichText(p.descricao) }} />}
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent">Ver <ArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
            ))}
          </div>
        ) : (
          <EmBreve texto="Nenhum procedimento nesta área ainda — chega em breve." />
        )}
      </section>

      {/* Calculadoras e ferramentas (apps grátis) */}
      <section>
        <SecaoHead icon={Calculator} titulo="Calculadoras e ferramentas" sub="Apps de apoio, de uso livre." />
        {calcs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {calcs.map((app) => {
              const AppIcon = iconMap[app.icon] ?? Calculator;
              return (
                <a key={app.title} href={app.link || "#"} target={app.link ? "_blank" : undefined} rel="noreferrer" className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20">
                  <div className="mb-3 flex items-center gap-3">
                    {app.imageUrl ? (
                      <div className="shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/10" style={{ width: app.imageSize ?? 44, height: app.imageSize ?? 44 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={app.imageUrl} alt={app.title} className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                        <AppIcon className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <h3 className="min-w-0 text-base font-semibold leading-snug text-white">{app.title}</h3>
                  </div>
                  {app.desc && <p className="line-clamp-2 text-sm text-white/55" dangerouslySetInnerHTML={{ __html: sanitizeRichText(app.desc) }} />}
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent">Abrir <ArrowRight className="h-3.5 w-3.5" /></span>
                </a>
              );
            })}
          </div>
        ) : (
          <EmBreve texto="Nenhuma calculadora nesta área ainda — chega em breve." />
        )}
      </section>
    </div>
  );
}
