"use client";

import { useState } from "react";
import { ArrowRight, ClipboardList } from "lucide-react";
import type { ProtocoloPublicoResumo } from "@/lib/protocolos-editora";

// Grid FILTRÁVEL dos protocolos publicados na Editora (documentos de página inteira →
// linkam para /protocolos/[slug]). O filtro por área casa por specialty OU areas (multi).

const ESP_LABEL: Record<string, string> = { emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral" };

type Area = "todos" | "emergencias" | "ti" | "anestesiologia";
const TABS: { value: Area; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "emergencias", label: "Emergências" },
  { value: "ti", label: "TI" },
  { value: "anestesiologia", label: "Anestesiologia" },
];

export default function ProtocolosEditoraGrid({ protocolos }: { protocolos: ProtocoloPublicoResumo[] }) {
  const [active, setActive] = useState<Area>("todos");
  const naArea = (p: ProtocoloPublicoResumo, a: Area) => a === "todos" || p.specialty === a || p.areas.includes(a);
  const filtrados = protocolos.filter((p) => naArea(p, active));

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.value} type="button" onClick={() => setActive(t.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${active === t.value ? "border-accent bg-accent/15 text-accent" : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <p className="text-sm text-white/40">Nenhum protocolo nesta área ainda.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((p) => (
            <a key={p.id} href={`/protocolos/${p.slug}`} className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-accent/40 hover:bg-white/[0.05]">
              <div className="flex items-center justify-between">
                <ClipboardList className="h-5 w-5 text-accent" />
                <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">{ESP_LABEL[p.specialty] ?? p.specialty}</span>
              </div>
              <h3 className="text-[15px] font-semibold leading-snug text-white group-hover:text-accent">{p.title}</h3>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-accent">Ver protocolo <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
