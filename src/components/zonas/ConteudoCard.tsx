import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Card genérico de conteúdo pras zonas (aula, texto científico, questões, pesquisa,
// atualização, artigo, curso, videoaula, convidado, podcast...). Link simples com
// tipo + título + badge de área. Reutilizado por todas as zonas.

const ESP_LABEL: Record<string, string> = {
  emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral",
};

export type ItemConteudo = {
  id: string;
  titulo: string;
  href: string;
  tipo: string;      // rótulo curto do tipo (ex.: "Aula", "Questões")
  area?: string;     // especialidade principal (código)
  areas?: string[];  // áreas extras
  externo?: boolean; // link externo (abre em nova aba)
};

export default function ConteudoCard({ item, cor }: { item: ItemConteudo; cor: string }) {
  const areaLabel = item.area && item.area !== "geral" ? ESP_LABEL[item.area] ?? item.area : null;
  const inner = (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: cor }}>{item.tipo}</span>
        {areaLabel && <span className="text-[10px] font-medium uppercase tracking-[0.05em] text-white/35">· {areaLabel}</span>}
      </div>
      <h3 className="mt-2 text-base font-semibold leading-snug text-white" style={{ overflowWrap: "anywhere" }}>{item.titulo}</h3>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent">Abrir <ArrowRight className="h-3.5 w-3.5" /></span>
    </>
  );
  const cls = "group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20";
  return item.externo
    ? <a href={item.href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
    : <Link href={item.href} className={cls}>{inner}</Link>;
}
