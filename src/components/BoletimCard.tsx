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

// Cor por ÁREA (mesma paleta dos cards manuais): Emergências=emerg, TI=inten, Anestesio=anest.
// Classes COMPLETAS porque o Tailwind não monta nome de classe dinâmico. Fallback = accent (verde).
type CorArea = { badge: string; borda: string; bordaAberto: string; logo: string; divisor: string; botao: string };
const COR_ACCENT: CorArea = {
  badge: "border-accent/40 bg-accent/10 text-accent",
  borda: "border-accent/25 hover:border-accent/40",
  bordaAberto: "border-accent/40 bg-accent/[0.04]",
  logo: "border-accent/20 bg-accent/[0.06]",
  divisor: "border-accent/15",
  botao: "border-accent/30 bg-accent/15 text-accent hover:bg-accent/25",
};
const AREA_COR: Record<string, CorArea> = {
  emergencias: {
    badge: "border-emerg/40 bg-emerg/10 text-emerg",
    borda: "border-emerg/25 hover:border-emerg/40",
    bordaAberto: "border-emerg/40 bg-emerg/[0.04]",
    logo: "border-emerg/20 bg-emerg/[0.06]",
    divisor: "border-emerg/15",
    botao: "border-emerg/30 bg-emerg/15 text-emerg hover:bg-emerg/25",
  },
  terapia_intensiva: {
    badge: "border-inten/40 bg-inten/10 text-inten",
    borda: "border-inten/25 hover:border-inten/40",
    bordaAberto: "border-inten/40 bg-inten/[0.04]",
    logo: "border-inten/20 bg-inten/[0.06]",
    divisor: "border-inten/15",
    botao: "border-inten/30 bg-inten/15 text-inten hover:bg-inten/25",
  },
  anestesiologia: {
    badge: "border-anest/40 bg-anest/10 text-anest",
    borda: "border-anest/25 hover:border-anest/40",
    bordaAberto: "border-anest/40 bg-anest/[0.04]",
    logo: "border-anest/20 bg-anest/[0.06]",
    divisor: "border-anest/15",
    botao: "border-anest/30 bg-anest/15 text-anest hover:bg-anest/25",
  },
};

// Card (vertical, na grade — mesmo padrão dos demais cards do site) de um boletim
// clínico da IA (medical_updates). Expande no local para mostrar o conteúdo completo.
export default function BoletimCard({ update, manual = false, logo }: { update: BoletimUpdate; manual?: boolean; logo?: { logoUrl?: string; emoji?: string } }) {
  const [open, setOpen] = useState(false);
  const data = dataCurta(update.data_publicacao);
  const c = AREA_COR[update.especialidade ?? ""] ?? COR_ACCENT;

  return (
    <article className={`flex flex-col rounded-2xl border bg-white/[0.03] p-5 transition ${open ? c.bordaAberto : c.borda}`}>
      {/* Logo + selo */}
      <div className="mb-3 flex items-center gap-2.5">
        {logo && (logo.logoUrl || logo.emoji) && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${c.logo}`}>
            {logo.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.logoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xl">{logo.emoji}</span>
            )}
          </div>
        )}
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${c.badge}`}>
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

      {/* Resumo — SÓ no preview (fechado). Ao abrir, o UpdateContent já mostra o resumo;
          mostrar aqui também duplicava o parágrafo (ficava repetido). */}
      {!open && update.resumo && (
        <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55 line-clamp-3">{update.resumo}</p>
      )}

      {/* Conteúdo completo ao expandir */}
      {open && (
        <div className={`mt-3 border-t ${c.divisor} pt-4`}>
          <UpdateContent update={update} />
        </div>
      )}

      {/* Ações — sempre visíveis. Baixar/Imprimir PDF só para os boletins da IA (têm id). */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${c.botao}`}
        >
          {open ? "Recolher" : "Ler boletim"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {!manual && update.id != null && (
          <>
            <a
              href={`/api/atualizacoes/${update.id}/pdf?dl=1`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/70 transition hover:text-white"
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
          </>
        )}
      </div>
    </article>
  );
}
