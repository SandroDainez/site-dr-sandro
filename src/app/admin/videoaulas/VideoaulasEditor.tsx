"use client";

import { useState, useTransition, useRef } from "react";
import { Save, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { VideoaulaData } from "@/lib/content";
import { saveVideoaulas, uploadImage } from "@/app/admin/actions";

type Props = {
  initialVideoaulas: VideoaulaData[];
};

const areaLabels: Record<VideoaulaData["area"], string> = {
  emergencias: "Emergências",
  ti: "Terapia Intensiva",
  anestesiologia: "Anestesiologia",
  geral: "Geral",
};

const areaColors: Record<VideoaulaData["area"], string> = {
  emergencias: "text-red-400 border-red-400/30",
  ti: "text-blue-400 border-blue-400/30",
  anestesiologia: "text-violet-400 border-violet-400/30",
  geral: "text-teal-400 border-teal-400/30",
};

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? match[1] : null;
}

export default function VideoaulasEditor({ initialVideoaulas }: Props) {
  const [items, setItems] = useState<VideoaulaData[]>(initialVideoaulas);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [uploadingVideoIdx, setUploadingVideoIdx] = useState<number | null>(null);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const videoFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  function updateItem(idx: number, field: keyof VideoaulaData, value: string | boolean) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    setSaved(false);
  }

  function addItem() {
    const newItem: VideoaulaData = {
      id: "",
      titulo: "",
      descricao: "",
      area: "geral",
      videoUrl: "",
      imageUrl: "",
      imageCaption: "",
      duracao: "",
      nivel: "",
      gratuita: false,
      data: new Date().toISOString().slice(0, 10),
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
      const result = await saveVideoaulas(items);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  async function handleImageUpload(idx: number, file: File) {
    setUploadingIdx(idx);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadImage(fd);
    setUploadingIdx(null);
    if (result.ok) {
      updateItem(idx, "imageUrl", result.url);
    } else {
      setError(result.error);
    }
  }

  async function handleVideoUpload(idx: number, file: File) {
    setUploadingVideoIdx(idx);
    setVideoProgress(0);
    setError(null);
    try {
      // Direct browser → Vercel Blob upload (bypasses serverless 4.5 MB limit)
      const blob = await upload(`videos/${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
        onUploadProgress: ({ percentage }) => {
          setVideoProgress(Math.round(percentage));
        },
      });
      // Convert private blob URL to proxy URL so it's servable
      const proxyUrl = `/api/img?url=${encodeURIComponent(blob.url)}`;
      updateItem(idx, "videoUrl", proxyUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar vídeo");
    } finally {
      setUploadingVideoIdx(null);
      setVideoProgress(0);
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const areaColor = areaColors[item.area] ?? "text-white/60 border-white/20";
        const ytId = item.videoUrl ? getYoutubeId(item.videoUrl) : null;
        const isProxyVideo = item.videoUrl.startsWith("/api/img");

        return (
          <div
            key={idx}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4"
          >
            {/* Top row: area badge + delete */}
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
                placeholder="via-aerea-avancada"
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

            {/* area + nivel row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                  Área
                </label>
                <select
                  value={item.area}
                  onChange={(e) => updateItem(idx, "area", e.target.value as VideoaulaData["area"])}
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
                >
                  <option value="geral">Geral</option>
                  <option value="emergencias">Emergências</option>
                  <option value="ti">Terapia Intensiva</option>
                  <option value="anestesiologia">Anestesiologia</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                  Nível
                </label>
                <select
                  value={item.nivel}
                  onChange={(e) => updateItem(idx, "nivel", e.target.value as VideoaulaData["nivel"])}
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
                >
                  <option value="">Não especificado</option>
                  <option value="basico">Básico</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>
            </div>

            {/* duracao + gratuita + data row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                  Duração (ex: 45 min)
                </label>
                <input
                  type="text"
                  value={item.duracao}
                  onChange={(e) => updateItem(idx, "duracao", e.target.value)}
                  placeholder="45 min"
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                  Acesso
                </label>
                <select
                  value={item.gratuita ? "true" : "false"}
                  onChange={(e) => updateItem(idx, "gratuita", e.target.value === "true")}
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
                >
                  <option value="false">Apenas assinantes</option>
                  <option value="true">Gratuita (acesso livre)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                  Data
                </label>
                <input
                  type="date"
                  value={item.data}
                  onChange={(e) => updateItem(idx, "data", e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
                />
              </div>
            </div>

            {/* descricao */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                Descrição
              </label>
              <textarea
                rows={3}
                value={item.descricao}
                onChange={(e) => updateItem(idx, "descricao", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50 resize-none"
              />
            </div>

            {/* Video upload section */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.1em] text-white/40">
                Vídeo
              </label>

              {/* Upload from Mac */}
              <div className="mb-3 space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => videoFileRefs.current[idx]?.click()}
                    disabled={uploadingVideoIdx === idx}
                    className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/70 transition hover:border-accent/40 hover:text-white disabled:opacity-50"
                  >
                    {uploadingVideoIdx === idx ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingVideoIdx === idx
                      ? `Enviando… ${videoProgress}%`
                      : "Enviar vídeo do Mac"}
                  </button>
                  {isProxyVideo && item.videoUrl && uploadingVideoIdx !== idx && (
                    <span className="text-xs text-accent/70">✓ Vídeo carregado</span>
                  )}
                </div>

                {/* Progress bar */}
                {uploadingVideoIdx === idx && (
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-200"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                ref={(el) => { videoFileRefs.current[idx] = el; }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleVideoUpload(idx, file);
                  e.target.value = "";
                }}
              />

              {/* URL input */}
              <div>
                <label className="mb-1 block text-xs text-white/30">
                  Ou cole uma URL
                </label>
                <input
                  type="text"
                  value={item.videoUrl}
                  onChange={(e) => updateItem(idx, "videoUrl", e.target.value)}
                  placeholder="https://youtube.com/watch?v=... ou link direto do vídeo"
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
                />
                <p className="mt-1 text-xs text-white/25">
                  YouTube, Google Drive, Vimeo ou URL direta de arquivo.
                </p>
              </div>

              {/* Video preview / status */}
              {isProxyVideo && item.videoUrl && (
                <video
                  src={item.videoUrl}
                  controls
                  className="w-full rounded-xl max-h-48 mt-2"
                />
              )}
              {ytId && (
                <p className="mt-1 text-xs text-white/40">🎬 YouTube link salvo</p>
              )}
            </div>

            {/* Thumbnail upload */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                Thumbnail
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRefs.current[idx]?.click()}
                  disabled={uploadingIdx === idx}
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/70 transition hover:border-accent/40 hover:text-white disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingIdx === idx ? "Enviando..." : "Upload de thumbnail"}
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
                ref={(el) => { fileRefs.current[idx] = el; }}
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
                </div>
              )}
            </div>

            {/* imageCaption */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                Legenda da thumbnail
              </label>
              <input
                type="text"
                value={item.imageCaption}
                onChange={(e) => updateItem(idx, "imageCaption", e.target.value)}
                placeholder="Legenda opcional exibida abaixo da imagem"
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
              />
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
        Adicionar videoaula
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar videoaulas"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
