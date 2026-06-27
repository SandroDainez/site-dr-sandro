"use client";

import { useState } from "react";
import { ClipboardList, PlayCircle, Newspaper, GraduationCap, Mic, FolderOpen, Download } from "lucide-react";
import { HubArticles, HubVideos } from "@/components/HubContent";
import type { ProtocoloData, VideoaulaData, AtualizacaoData, CursoData, PodcastData, AcervoItemData } from "@/lib/content";

type Area = "emergencias" | "ti" | "anestesiologia";

// Conteúdo pode pertencer a mais de uma especialidade (campo opcional `areas`).
function inArea(item: { area?: string; areas?: string[] }, area: Area | "todas"): boolean {
  if (area === "todas") return true;
  return item.area === area || (Array.isArray(item.areas) && item.areas.includes(area));
}

const AREA_TABS: { value: Area | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "emergencias", label: "🚑 Emergências" },
  { value: "ti", label: "🏥 Terapia Intensiva" },
  { value: "anestesiologia", label: "🩺 Anestesiologia" },
];

type TypeKey = "tudo" | "protocolos" | "videoaulas" | "atualizacoes" | "cursos" | "podcast" | "acervo";
const TYPE_TABS: { value: TypeKey; label: string }[] = [
  { value: "tudo", label: "Tudo" },
  { value: "protocolos", label: "Protocolos" },
  { value: "videoaulas", label: "Videoaulas" },
  { value: "atualizacoes", label: "Atualizações" },
  { value: "cursos", label: "Cursos" },
  { value: "podcast", label: "Podcast" },
  { value: "acervo", label: "Acervo" },
];

type Props = {
  protocolos: ProtocoloData[];
  videoaulas: VideoaulaData[];
  atualizacoes: AtualizacaoData[];
  cursos: CursoData[];
  podcasts: PodcastData[];
  acervo: AcervoItemData[];
};

function Section({ icon: Icon, titulo, verHref, children }: { icon: typeof ClipboardList; titulo: string; verHref?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
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

const cardCls = "rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20";

export default function ConteudoBrowser({ protocolos, videoaulas, atualizacoes, cursos, podcasts, acervo }: Props) {
  const [type, setType] = useState<TypeKey>("tudo");
  const [area, setArea] = useState<Area | "todas">("todas");

  const proto = protocolos.filter((p) => p.titulo && inArea(p, area));
  const vids = videoaulas.filter((v) => v.titulo && inArea(v, area));
  const atu = [...atualizacoes].filter((x) => x.titulo && inArea(x, area)).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const curs = cursos.filter((c) => c.titulo && inArea(c, area));
  const docs = acervo.filter((d) => d.titulo && inArea(d, area));
  // Podcast não tem especialidade: só aparece quando a área é "todas".
  const pods = area === "todas" ? podcasts.filter((p) => p.titulo) : [];

  const show = (t: TypeKey) => type === "tudo" || type === t;
  const total = (show("protocolos") ? proto.length : 0) + (show("videoaulas") ? vids.length : 0) + (show("atualizacoes") ? atu.length : 0) + (show("cursos") ? curs.length : 0) + (show("podcast") ? pods.length : 0) + (show("acervo") ? docs.length : 0);

  return (
    <div>
      {/* filtros */}
      <div className="mb-8 space-y-3">
        <div className="flex flex-wrap gap-2">
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
        <div className="flex flex-wrap gap-2">
          {AREA_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setArea(t.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${area === t.value ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-transparent text-white/50 hover:text-white/80"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
          <p className="text-sm text-white/50">Nenhum conteúdo para este filtro.</p>
        </div>
      ) : (
        <>
          {show("protocolos") && proto.length > 0 && (
            <Section icon={ClipboardList} titulo="Protocolos" verHref="/protocolos">
              <HubArticles
                accent="text-accent"
                items={proto.map((p) => ({
                  id: p.id, titulo: p.titulo, conteudo: p.conteudo, resumo: p.descricao,
                  imageUrl: p.imageUrl, imageCaption: p.imageCaption, imageSize: p.imageSize, data: p.data,
                  download: p.arquivoUrl ? { url: p.arquivoUrl, label: p.arquivoLabel || "Abrir material" } : undefined,
                }))}
              />
            </Section>
          )}

          {show("videoaulas") && vids.length > 0 && (
            <Section icon={PlayCircle} titulo="Videoaulas" verHref="/videoaulas">
              <HubVideos accent="text-accent" items={vids.map((v) => ({ id: v.id, titulo: v.titulo, descricao: v.descricao, videoUrl: v.videoUrl, duracao: v.duracao }))} />
            </Section>
          )}

          {show("atualizacoes") && atu.length > 0 && (
            <Section icon={Newspaper} titulo="Atualizações" verHref="/atualizacoes">
              <HubArticles
                accent="text-accent"
                items={atu.map((x) => ({ id: x.id, titulo: x.titulo, conteudo: x.conteudo, imageUrl: x.imageUrl, imageCaption: x.imageCaption, imageSize: x.imageSize, data: x.data, sourceUrl: x.link }))}
              />
            </Section>
          )}

          {show("cursos") && curs.length > 0 && (
            <Section icon={GraduationCap} titulo="Cursos" verHref="/cursos">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {curs.map((c) => (
                  <a key={c.id} href={`/cursos/${c.id}`} className={cardCls}>
                    <p className="text-sm font-semibold text-white">{c.titulo}</p>
                    {c.resumo && <p className="mt-1 line-clamp-2 text-xs text-white/50">{c.resumo}</p>}
                  </a>
                ))}
              </div>
            </Section>
          )}

          {show("podcast") && pods.length > 0 && (
            <Section icon={Mic} titulo="Podcast" verHref="/podcast">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pods.map((p) => {
                  const href = p.embedUrl || p.audioUrl || "/podcast";
                  return (
                    <a key={p.id} href={href} target={/^https?:/.test(href) ? "_blank" : undefined} rel="noreferrer" className={cardCls}>
                      <p className="text-sm font-semibold text-white">{p.titulo}</p>
                      {p.duracao && <p className="mt-1 text-xs text-white/40">⏱ {p.duracao}</p>}
                    </a>
                  );
                })}
              </div>
            </Section>
          )}

          {show("acervo") && docs.length > 0 && (
            <Section icon={FolderOpen} titulo="Acervo e materiais" verHref="/acervo">
              <div className="grid gap-3 sm:grid-cols-2">
                {docs.map((d) => (
                  <div key={d.id} className={cardCls}>
                    <p className="text-sm font-semibold text-white">{d.titulo}</p>
                    {d.arquivos.filter((x) => x.url).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {d.arquivos.filter((x) => x.url).map((arq) => (
                          <a key={arq.id} href={arq.url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent transition hover:bg-accent/20">
                            <Download className="h-3 w-3" /> {arq.titulo || arq.tipo}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
