"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, Download, Printer } from "lucide-react";
import UpdateContent, { type UpdateContentData } from "./UpdateContent";
import { dataCurta } from "@/lib/format-date";

export interface BoletimUpdate extends UpdateContentData {
  id?: string | number;
  especialidade?: string;
  titulo?: string;
  semana_referencia?: string;
  data_publicacao?: string;
}

const ESP_LABEL: Record<string, string> = {
  anestesiologia: "Anestesiologia",
  terapia_intensiva: "Terapia Intensiva",
  emergencias: "Emergências",
};

// Card (vertical, na grade — mesmo padrão dos demais cards do site) de um boletim
// clínico da IA (medical_updates). Expande no local para mostrar o conteúdo completo.
export default function BoletimCard({ update, manual = false, logo }: { update: BoletimUpdate; manual?: boolean; logo?: { logoUrl?: string; emoji?: string } }) {
  const [open, setOpen] = useState(false);
  const data = dataCurta(update.data_publicacao);

  return (
    <article className={`flex flex-col rounded-2xl border bg-white/[0.03] p-5 transition ${open ? "border-accent/40 bg-accent/[0.04]" : "border-accent/25 hover:border-accent/40"}`}>
      {/* Logo + selo */}
      <div className="mb-3 flex items-center gap-2.5">
        {logo && (logo.logoUrl || logo.emoji) && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-accent/20 bg-accent/[0.06]">
            {logo.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.logoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xl">{logo.emoji}</span>
            )}
          </div>
        )}
        <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent">
          <Sparkles className="h-3 w-3" /> {manual ? "Boletim" : "Boletim da semana"}
        </span>
      </div>

      {/* Metadados */}
      <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] text-white/45">
        <span>{ESP_LABEL[update.especialidade ?? ""] ?? update.especialidade}</span>
        {update.semana_referencia && <span>· {update.semana_referencia}</span>}
        {data && <span>· {data}</span>}
      </div>

      {/* Título */}
      <h3 className="text-[15px] font-semibold leading-snug text-white">{update.titulo}</h3>

      {/* Resumo (recortado quando fechado) */}
      {update.resumo && (
        <p className={`mt-2 flex-1 text-sm leading-relaxed text-white/55 ${open ? "" : "line-clamp-3"}`}>{update.resumo}</p>
      )}

      {/* Conteúdo completo ao expandir */}
      {open && (
        <div className="mt-3 border-t border-accent/15 pt-4">
          <UpdateContent update={update} />

          {/* Baixar / imprimir — só para os boletins da IA (têm id no banco). */}
          {!manual && update.id != null && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
              <a
                href={`/api/atualizacoes/${update.id}/pdf?dl=1`}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-4 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25"
              >
                <Download className="h-3.5 w-3.5" /> Baixar PDF
              </a>
              <a
                href={`/api/atualizacoes/${update.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/70 transition hover:text-white"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimir
              </a>
            </div>
          )}
        </div>
      )}

      {/* Ação */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 inline-flex w-fit items-center gap-1.5 self-start rounded-full border border-accent/30 bg-accent/15 px-4 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25"
      >
        {open ? "Recolher" : "Ler boletim"}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </article>
  );
}
