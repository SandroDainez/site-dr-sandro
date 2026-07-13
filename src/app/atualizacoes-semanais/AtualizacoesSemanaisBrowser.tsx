"use client";

import { useState } from "react";
import { ChevronDown, Download, Printer } from "lucide-react";
import UpdateContent from "@/components/UpdateContent";
import { dataLonga } from "@/lib/format-date";
import type { MedicalUpdate } from "@/types/medical";

type Area = "todas" | "anestesiologia" | "terapia_intensiva" | "emergencias";

const TABS: { value: Area; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "anestesiologia", label: "🩺 Anestesiologia" },
  { value: "terapia_intensiva", label: "🏥 Terapia Intensiva" },
  { value: "emergencias", label: "🚑 Emergências" },
];

const ESP_BADGE: Record<string, string> = {
  anestesiologia: "border-anest/30 bg-anest/10 text-anest",
  terapia_intensiva: "border-inten/30 bg-inten/10 text-inten",
  emergencias: "border-emerg/30 bg-emerg/10 text-emerg",
};
const ESP_LABEL: Record<string, string> = {
  anestesiologia: "Anestesiologia",
  terapia_intensiva: "Terapia Intensiva",
  emergencias: "Emergências",
};

const fmt = dataLonga;

export default function AtualizacoesSemanaisBrowser({ updates, initialArea }: { updates: MedicalUpdate[]; initialArea?: string }) {
  const valid = TABS.some((t) => t.value === initialArea) ? (initialArea as Area) : "todas";
  const [area, setArea] = useState<Area>(valid);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const filtradas = area === "todas" ? updates : updates.filter((u) => u.especialidade === area);

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setArea(t.value)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${area === t.value ? "border-accent/50 bg-accent/15 text-accent" : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
          <p className="text-sm text-white/50">Ainda não há boletins publicados{area !== "todas" ? " para esta especialidade" : ""}. O primeiro sai na próxima segunda-feira.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((u) => {
            const isOpen = open.has(u.id);
            return (
              <div key={u.id} className={`overflow-hidden rounded-2xl border transition ${isOpen ? "border-white/20 bg-white/[0.03]" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                <button type="button" onClick={() => toggle(u.id)} aria-expanded={isOpen} className="flex w-full items-start justify-between gap-3 p-5 text-left">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                      <span className={`rounded-full border px-2 py-0.5 font-semibold ${ESP_BADGE[u.especialidade] ?? "border-white/15 text-white/50"}`}>{ESP_LABEL[u.especialidade] ?? u.especialidade}</span>
                      <span>{u.semana_referencia}</span>
                      <span>·</span>
                      <span>{fmt(u.data_publicacao)}</span>
                      <span>·</span>
                      <span>{Array.isArray(u.fontes) ? u.fontes.length : 0} fontes</span>
                    </div>
                    <p className="text-base font-semibold text-white">{u.titulo}</p>
                    {!isOpen && u.resumo && <p className="mt-1 line-clamp-2 text-sm text-white/55">{u.resumo}</p>}
                  </div>
                  <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-accent transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {/* Ações sempre visíveis — não precisa abrir pra baixar/imprimir */}
                <div className="flex flex-wrap gap-2 px-5 pb-4">
                  <a href={`/api/atualizacoes/${u.id}/pdf?dl=1`} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/70 transition hover:text-white">
                    <Download className="h-3.5 w-3.5" /> Baixar PDF
                  </a>
                  <a href={`/api/atualizacoes/${u.id}/pdf`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/70 transition hover:text-white">
                    <Printer className="h-3.5 w-3.5" /> Imprimir
                  </a>
                </div>
                {isOpen && (
                  <div className="border-t border-white/10 px-5 pb-6 pt-4">
                    <UpdateContent update={u} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
