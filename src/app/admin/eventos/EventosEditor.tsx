"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";
import type { EventoData } from "@/lib/content";
import { saveEventos } from "@/app/admin/actions";

type Props = {
  initialEventos: EventoData[];
};

const emptyEvento = (): EventoData => ({
  slug: "",
  titulo: "",
  descricao: "",
  investimento: "",
  data: "",
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function EventosEditor({ initialEventos }: Props) {
  const [eventos, setEventos] = useState<EventoData[]>(initialEventos);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function updateEvento(index: number, field: keyof EventoData, value: string) {
    setEventos((prev) =>
      prev.map((e, i) => {
        if (i !== index) return e;
        const updated = { ...e, [field]: value };
        if (field === "titulo" && !e.slug) {
          updated.slug = slugify(value);
        }
        return updated;
      })
    );
    setSaved(false);
  }

  function addEvento() {
    setEventos((prev) => [...prev, emptyEvento()]);
    setSaved(false);
  }

  function removeEvento(index: number) {
    setEventos((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveEventos(eventos);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      {eventos.map((evento, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/40">
              <GripVertical className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.12em]">Evento {index + 1}</span>
            </div>
            <button
              type="button"
              onClick={() => removeEvento(index)}
              className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
                Data (AAAA-MM-DD)
              </label>
              <input
                type="date"
                value={evento.data}
                onChange={(e) => updateEvento(index, "data", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent-blue/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
                Investimento
              </label>
              <input
                type="text"
                placeholder="R$ 890,00"
                value={evento.investimento}
                onChange={(e) => updateEvento(index, "investimento", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-blue/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              Título
            </label>
            <input
              type="text"
              placeholder="Ex: Manejo de via aérea no paciente crítico"
              value={evento.titulo}
              onChange={(e) => updateEvento(index, "titulo", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-blue/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              Slug (URL)
            </label>
            <input
              type="text"
              placeholder="manejo-via-aerea-critico"
              value={evento.slug}
              onChange={(e) => updateEvento(index, "slug", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/60 placeholder:text-white/25 outline-none transition focus:border-accent-blue/50 font-mono text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              Descrição
            </label>
            <textarea
              rows={2}
              placeholder="Descrição curta do evento..."
              value={evento.descricao}
              onChange={(e) => updateEvento(index, "descricao", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-blue/50 resize-none"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEvento}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-transparent py-4 text-sm text-white/50 transition hover:border-accent-blue/40 hover:text-accent-blue"
      >
        <Plus className="h-4 w-4" /> Adicionar evento
      </button>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar eventos"}
        </button>
        {saved && (
          <span className="text-sm text-accent">✓ Salvo com sucesso</span>
        )}
      </div>
    </div>
  );
}
