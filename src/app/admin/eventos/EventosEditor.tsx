"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, GripVertical, Upload, Loader2 } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { EventoData } from "@/lib/content";
import { saveEventos } from "@/app/admin/actions";

type Props = {
  initialEventos: EventoData[];
};

const TIPO_OPTIONS = [
  "Curso",
  "Workshop prático",
  "Imersão",
  "Congresso",
  "Webinar",
  "Aula ao vivo",
  "Mentoria",
];

const emptyEvento = (): EventoData => ({
  slug: "",
  titulo: "",
  descricao: "",
  investimento: "",
  data: "",
  tipo: "",
  horario: "",
  local: "",
  cargaHoraria: "",
  publicoAlvo: "",
  programacao: "",
  inscricaoUrl: "",
  folderUrl: "",
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
  const [error, setError] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  async function handleFolderUpload(index: number, file: File) {
    setError(null);
    setUploadingIdx(index);
    try {
      const blob = await upload(`eventos/${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      });
      const proxyUrl = `/api/img?url=${encodeURIComponent(blob.url)}`;
      updateEvento(index, "folderUrl", proxyUrl);
    } catch (e) {
      setError("Falha no upload do folder: " + String(e instanceof Error ? e.message : e));
    } finally {
      setUploadingIdx(null);
    }
  }

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
    setError(null);
    startTransition(async () => {
      const result = await saveEventos(eventos);
      if (result.ok) {
        setSaved(true);
      } else {
        setError(result.error);
      }
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
              Descrição curta
            </label>
            <textarea
              rows={2}
              placeholder="Resumo do evento (aparece no card e no topo da página)..."
              value={evento.descricao}
              onChange={(e) => updateEvento(index, "descricao", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-blue/50 resize-none"
            />
          </div>

          {/* Tipo + Horário */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
                Tipo de evento
              </label>
              <input
                list={`tipos-${index}`}
                type="text"
                placeholder="Ex: Workshop prático"
                value={evento.tipo ?? ""}
                onChange={(e) => updateEvento(index, "tipo", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-blue/50"
              />
              <datalist id={`tipos-${index}`}>
                {TIPO_OPTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
                Horário
              </label>
              <input
                type="text"
                placeholder="Ex: 08h às 17h"
                value={evento.horario ?? ""}
                onChange={(e) => updateEvento(index, "horario", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-blue/50"
              />
            </div>
          </div>

          {/* Local + Carga horária */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
                Local
              </label>
              <input
                type="text"
                placeholder="Ex: Online (Zoom) ou São Paulo - SP"
                value={evento.local ?? ""}
                onChange={(e) => updateEvento(index, "local", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-blue/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
                Carga horária
              </label>
              <input
                type="text"
                placeholder="Ex: 8 horas"
                value={evento.cargaHoraria ?? ""}
                onChange={(e) => updateEvento(index, "cargaHoraria", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-blue/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              Público-alvo
            </label>
            <input
              type="text"
              placeholder="Ex: Médicos, residentes e estudantes de medicina"
              value={evento.publicoAlvo ?? ""}
              onChange={(e) => updateEvento(index, "publicoAlvo", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-blue/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              Programação / conteúdo (uma linha por tópico)
            </label>
            <textarea
              rows={5}
              placeholder={"Avaliação de via aérea difícil\nPré-oxigenação\nSequência rápida de intubação\nDispositivos de resgate"}
              value={evento.programacao ?? ""}
              onChange={(e) => updateEvento(index, "programacao", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-blue/50 resize-y"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              Link de inscrição (opcional — botão externo)
            </label>
            <input
              type="url"
              placeholder="https://... (Sympla, Hotmart, formulário, etc.)"
              value={evento.inscricaoUrl ?? ""}
              onChange={(e) => updateEvento(index, "inscricaoUrl", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-blue/50"
            />
            <p className="mt-1 text-[11px] text-white/35">
              Se preenchido, o botão leva direto para esse link. Se vazio, mostra o formulário interno de interesse.
            </p>
          </div>

          {/* Folder / cartaz do evento */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              Folder / cartaz do evento
            </label>
            <div className="flex items-center gap-3">
              {evento.folderUrl ? (
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={evento.folderUrl} alt="Folder" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/15 bg-black/20 text-[10px] text-white/30">
                  sem img
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  id={`folder-${index}`}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFolderUpload(index, f);
                    e.target.value = "";
                  }}
                />
                <label
                  htmlFor={`folder-${index}`}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white transition hover:bg-white/[0.10] ${uploadingIdx === index ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {uploadingIdx === index ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>
                  ) : (
                    <><Upload className="h-3.5 w-3.5" /> Enviar folder</>
                  )}
                </label>
                {evento.folderUrl && (
                  <button
                    type="button"
                    onClick={() => updateEvento(index, "folderUrl", "")}
                    className="text-xs text-white/40 transition hover:text-red-400"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
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
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && (
          <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>
        )}
      </div>
    </div>
  );
}
