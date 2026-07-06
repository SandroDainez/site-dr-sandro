"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import UpdateContent from "./UpdateContent";
import { dataCurta } from "@/lib/format-date";

const ESP_LABEL: Record<string, string> = {
  anestesiologia: "Anestesiologia",
  terapia_intensiva: "Terapia Intensiva",
  emergencias: "Emergências",
};

// Card colapsável de um boletim clínico da IA (medical_updates) dentro do feed
// unificado de Atualizações.
export default function BoletimCard({ update, manual = false, logo }: { update: any; manual?: boolean; logo?: { logoUrl?: string; emoji?: string } }) {
  const [open, setOpen] = useState(false);
  const data = dataCurta(update.data_publicacao);

  return (
    <div className={`overflow-hidden rounded-2xl border transition ${open ? "border-accent/40 bg-accent/[0.05]" : "border-accent/25 bg-accent/[0.03] hover:border-accent/40"}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 p-5 text-left">
        <div className="flex min-w-0 items-start gap-3">
          {logo && (logo.logoUrl || logo.emoji) && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-accent/20 bg-accent/[0.06]">
              {logo.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.logoUrl} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-xl">{logo.emoji}</span>
              )}
            </div>
          )}
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-white/50">
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-semibold text-accent"><Sparkles className="h-3 w-3" /> {manual ? "Boletim" : "Boletim da semana"}</span>
              <span>{ESP_LABEL[update.especialidade] ?? update.especialidade}</span>
              {update.semana_referencia && <span>· {update.semana_referencia}</span>}
              {data && <span>· {data}</span>}
            </div>
            <p className="text-base font-semibold text-white">{update.titulo}</p>
            {!open && update.resumo && <p className="mt-1 line-clamp-2 text-sm text-white/55">{update.resumo}</p>}
          </div>
        </div>
        <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-accent transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-accent/15 px-5 pb-6 pt-4">
          <UpdateContent update={update} />
        </div>
      )}
    </div>
  );
}
