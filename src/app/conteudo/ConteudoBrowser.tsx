"use client";

import { useState } from "react";
import { ClipboardList, PlayCircle, Newspaper, GraduationCap, Mic, FolderOpen, Users } from "lucide-react";
import ProtocoloCard from "@/components/ProtocoloCard";
import { VideoCard } from "@/app/videoaulas/VideoaulasGrid";
import { UpdateCard } from "@/app/atualizacoes/AtualizacoesGrid";
import PodcastList from "@/app/podcast/PodcastList";
import AcervoList from "@/app/acervo/AcervoList";
import ColaboradoresList from "@/app/colaboradores/ColaboradoresList";
import type { ProtocoloData, VideoaulaData, AtualizacaoData, CursoData, PodcastData, AcervoItemData, ColaboradorData } from "@/lib/content";

// "Todo o conteúdo": tudo o que o site já tem, com os MESMOS cards usados em
// cada seção do site (não um layout novo). Filtro por tipo só para estreitar.
type TypeKey = "tudo" | "atualizacoes" | "protocolos" | "videoaulas" | "cursos" | "podcast" | "parceiros" | "acervo";
const TYPE_TABS: { value: TypeKey; label: string }[] = [
  { value: "tudo", label: "Tudo" },
  { value: "atualizacoes", label: "Atualizações" },
  { value: "protocolos", label: "Protocolos" },
  { value: "videoaulas", label: "Videoaulas" },
  { value: "cursos", label: "Cursos" },
  { value: "podcast", label: "Podcast" },
  { value: "parceiros", label: "Parceiros" },
  { value: "acervo", label: "Acervo" },
];

type Props = {
  protocolos: ProtocoloData[];
  videoaulas: VideoaulaData[];
  atualizacoes: AtualizacaoData[];
  cursos: CursoData[];
  podcasts: PodcastData[];
  acervo: AcervoItemData[];
  colaboradores: ColaboradorData[];
};

function Section({ icon: Icon, titulo, verHref, children }: { icon: typeof ClipboardList; titulo: string; verHref?: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <Icon className="h-5 w-5 text-accent" /> {titulo}
        </h2>
        {verHref && (
          <a href={verHref} className="text-xs font-medium text-accent/80 transition hover:text-accent">
            Ver todos →
          </a>
        )}
      </div>
      {children}
    </section>
  );
}

export default function ConteudoBrowser({ protocolos, videoaulas, atualizacoes, cursos, podcasts, acervo, colaboradores }: Props) {
  const [type, setType] = useState<TypeKey>("tudo");

  const atu = [...atualizacoes].filter((x) => x.titulo).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const proto = protocolos.filter((p) => p.titulo);
  const vids = videoaulas.filter((v) => v.titulo);
  const curs = cursos.filter((c) => c.titulo);
  const pods = podcasts.filter((p) => p.titulo);
  const docs = acervo.filter((d) => d.titulo);
  const colabs = colaboradores.filter((c) => c.titulo);

  const show = (t: TypeKey) => type === "tudo" || type === t;
  const total =
    (show("atualizacoes") ? atu.length : 0) +
    (show("protocolos") ? proto.length : 0) +
    (show("videoaulas") ? vids.length : 0) +
    (show("cursos") ? curs.length : 0) +
    (show("podcast") ? pods.length : 0) +
    (show("parceiros") ? colabs.length : 0) +
    (show("acervo") ? docs.length : 0);

  return (
    <div>
      {/* filtro por tipo */}
      <div className="mb-10 flex flex-wrap gap-2">
        {TYPE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${type === t.value ? "border-accent/50 bg-accent/15 text-accent" : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
          <p className="text-sm text-white/50">Nenhum conteúdo para este filtro.</p>
        </div>
      ) : (
        <>
          {show("atualizacoes") && atu.length > 0 && (
            <Section icon={Newspaper} titulo="Atualizações" verHref="/atualizacoes">
              <div className="flex flex-col gap-4">
                {atu.map((x) => <UpdateCard key={x.id} item={x} />)}
              </div>
            </Section>
          )}

          {show("protocolos") && proto.length > 0 && (
            <Section icon={ClipboardList} titulo="Protocolos" verHref="/protocolos">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {proto.map((p) => <ProtocoloCard key={p.id} item={p} />)}
              </div>
            </Section>
          )}

          {show("videoaulas") && vids.length > 0 && (
            <Section icon={PlayCircle} titulo="Videoaulas" verHref="/videoaulas">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {vids.map((v) => <VideoCard key={v.id} item={v} />)}
              </div>
            </Section>
          )}

          {show("cursos") && curs.length > 0 && (
            <Section icon={GraduationCap} titulo="Cursos" verHref="/cursos">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {curs.map((c) => (
                  <a key={c.id} href={`/cursos/${c.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
                    {c.capaUrl && (
                      <div className="overflow-hidden border-b border-white/10 bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img loading="lazy" decoding="async" src={c.capaUrl} alt={c.titulo} className="aspect-video w-full object-cover transition group-hover:scale-[1.03]" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-sm font-semibold text-white">{c.titulo}</p>
                      {c.resumo && <p className="mt-1 line-clamp-2 text-xs text-white/50">{c.resumo}</p>}
                    </div>
                  </a>
                ))}
              </div>
            </Section>
          )}

          {show("podcast") && pods.length > 0 && (
            <Section icon={Mic} titulo="Podcast" verHref="/podcast">
              <PodcastList podcasts={pods} />
            </Section>
          )}

          {show("parceiros") && colabs.length > 0 && (
            <Section icon={Users} titulo="Parceiros" verHref="/colaboradores">
              <ColaboradoresList items={colabs} />
            </Section>
          )}

          {show("acervo") && docs.length > 0 && (
            <Section icon={FolderOpen} titulo="Acervo e materiais" verHref="/acervo">
              <AcervoList itens={docs} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}
