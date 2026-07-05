"use client";

import { useState, useTransition, useRef } from "react";
import { Save, Plus, Trash2, Upload, FileText, Loader2, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { ProtocoloData } from "@/lib/content";
import RichTextEditor from "@/components/admin/RichTextEditor";
import AreasExtra from "@/components/admin/AreasExtra";
import { saveProtocolos } from "@/app/admin/actions";

type Props = {
  initialProtocolos: ProtocoloData[];
};

const areaLabels: Record<ProtocoloData["area"], string> = {
  emergencias: "Emergências",
  ti: "Terapia Intensiva",
  anestesiologia: "Anestesiologia",
};

const areaColors: Record<ProtocoloData["area"], string> = {
  emergencias: "text-emerg border-emerg/30",
  ti: "text-inten border-inten/30",
  anestesiologia: "text-anest border-anest/30",
};

export default function ProtocolosEditor({ initialProtocolos }: Props) {
  const [items, setItems] = useState<ProtocoloData[]>(initialProtocolos);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [uploadingPdfIdx, setUploadingPdfIdx] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handlePdfUpload(idx: number, file: File) {
    setError(null);
    setUploadingPdfIdx(idx);
    try {
      // Upload direto navegador → Vercel Blob (ignora o limite de 1MB das Server Actions)
      const blob = await upload(`protocolos/${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      });
      updateItem(idx, "arquivoUrl", `/api/img?url=${encodeURIComponent(blob.url)}`);
    } catch (e) {
      setError("Falha no upload do PDF: " + String(e instanceof Error ? e.message : e));
    } finally {
      setUploadingPdfIdx(null);
    }
  }

  function updateItem<K extends keyof ProtocoloData>(idx: number, field: K, value: ProtocoloData[K]) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    setSaved(false);
  }

  function addItem() {
    const newItem: ProtocoloData = {
      id: "",
      titulo: "",
      descricao: "",
      conteudo: "",
      area: "emergencias",
      imageUrl: "",
      imageCaption: "",
      arquivoUrl: "",
      arquivoLabel: "Baixar PDF",
      data: new Date().toISOString().slice(0, 10),
      areas: [],
    };
    setItems((prev) => [...prev, newItem]);
    setSaved(false);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveProtocolos(items);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  async function handleImageUpload(idx: number, file: File) {
    setError(null);
    setUploadingIdx(idx);
    try {
      // Upload direto navegador → Vercel Blob (sem o limite de 1MB das Server Actions)
      const blob = await upload(`protocolos/${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      });
      updateItem(idx, "imageUrl", `/api/img?url=${encodeURIComponent(blob.url)}`);
    } catch (e) {
      setError("Falha no upload da imagem: " + String(e instanceof Error ? e.message : e));
    } finally {
      setUploadingIdx(null);
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const areaColor = areaColors[item.area] ?? "text-white/60 border-white/20";
        return (
          <div
            key={idx}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${areaColor}`}
              >
                {areaLabels[item.area]}
              </span>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="rounded-lg p-1.5 text-white/40 transition hover:bg-red-400/10 hover:text-red-400"
                title="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* id */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                Slug único (sem espaços)
              </label>
              <input
                type="text"
                value={item.id}
                onChange={(e) => updateItem(idx, "id", e.target.value)}
                placeholder="manejo-via-aerea-critico"
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
              />
            </div>

            {/* titulo */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                Título
              </label>
              <input
                type="text"
                value={item.titulo}
                onChange={(e) => updateItem(idx, "titulo", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
              />
            </div>

            {/* area + data row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                  Área
                </label>
                <select
                  value={item.area}
                  onChange={(e) =>
                    updateItem(idx, "area", e.target.value as ProtocoloData["area"])
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
                >
                  <option value="emergencias">Emergências</option>
                  <option value="ti">Terapia Intensiva</option>
                  <option value="anestesiologia">Anestesiologia</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                  Data de atualização
                </label>
                <input
                  type="date"
                  value={item.data}
                  onChange={(e) => updateItem(idx, "data", e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
                />
              </div>
            </div>

            <AreasExtra value={item.areas} primary={item.area} onChange={(areas) => updateItem(idx, "areas", areas)} />

            {/* descricao */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                Descrição curta (aparece no card)
              </label>
              <RichTextEditor value={item.descricao} onChange={(html) => updateItem(idx, "descricao", html)} />
            </div>

            {/* conteudo */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                Conteúdo completo
              </label>
              <RichTextEditor value={item.conteudo} onChange={(html) => updateItem(idx, "conteudo", html)} />
            </div>

            {/* image upload */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                Imagem
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRefs.current[idx]?.click()}
                  disabled={uploadingIdx === idx}
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/70 transition hover:border-accent/40 hover:text-white disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingIdx === idx ? "Enviando..." : "Upload de imagem"}
                </button>
                {item.imageUrl && (
                  <button
                    type="button"
                    onClick={() => updateItem(idx, "imageUrl", "")}
                    className="text-xs text-red-400/70 transition hover:text-red-400"
                  >
                    Remover imagem
                  </button>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={(el) => {
                  fileRefs.current[idx] = el;
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(idx, file);
                  e.target.value = "";
                }}
              />
              {item.imageUrl && (
                <div className="mt-2">
                  <img
                    src={item.imageUrl}
                    alt="Preview"
                    className="h-28 w-auto rounded-xl border border-white/10 object-cover"
                  />
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs text-white/40">Tamanho da imagem no site</label>
                      <span className="text-xs font-semibold tabular-nums text-accent">{item.imageSize ?? 176}px</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={400}
                      value={item.imageSize ?? 176}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, imageSize: v } : it)));
                        setSaved(false);
                      }}
                      className="w-full accent-[var(--accent,#2ce6b8)]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* imageCaption */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                Legenda da imagem
              </label>
              <input
                type="text"
                value={item.imageCaption}
                onChange={(e) => updateItem(idx, "imageCaption", e.target.value)}
                placeholder="Legenda opcional exibida abaixo da imagem"
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
              />
            </div>

            {/* arquivoUrl + arquivoLabel row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                  Arquivo / PDF (envie ou cole um link)
                </label>
                <input
                  type="url"
                  value={item.arquivoUrl}
                  onChange={(e) => updateItem(idx, "arquivoUrl", e.target.value)}
                  placeholder="https://... ou envie um PDF abaixo"
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="application/pdf"
                    id={`pdf-${idx}`}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePdfUpload(idx, f);
                      e.target.value = "";
                    }}
                  />
                  <label
                    htmlFor={`pdf-${idx}`}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-3 py-1.5 text-xs text-white transition hover:bg-white/10 ${uploadingPdfIdx === idx ? "pointer-events-none opacity-50" : ""}`}
                  >
                    {uploadingPdfIdx === idx ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando PDF...</>
                    ) : (
                      <><Upload className="h-3.5 w-3.5" /> Enviar PDF</>
                    )}
                  </label>
                  {item.arquivoUrl && (
                    <span className="flex items-center gap-1.5 text-xs text-accent">
                      <FileText className="h-3.5 w-3.5" /> Arquivo anexado
                      <button
                        type="button"
                        onClick={() => updateItem(idx, "arquivoUrl", "")}
                        className="ml-1 text-white/40 transition hover:text-red-400"
                        title="Remover arquivo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                  Texto do botão (ex: Baixar PDF)
                </label>
                <input
                  type="text"
                  value={item.arquivoLabel}
                  onChange={(e) => updateItem(idx, "arquivoLabel", e.target.value)}
                  placeholder="Baixar PDF"
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
                />
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-3 text-sm text-white/50 transition hover:border-white/40 hover:text-white/80"
      >
        <Plus className="h-4 w-4" />
        Adicionar protocolo
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar protocolos"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
