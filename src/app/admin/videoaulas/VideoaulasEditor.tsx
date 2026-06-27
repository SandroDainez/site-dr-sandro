"use client";

import { useState, useTransition, useRef } from "react";
import { Save, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { VideoaulaData } from "@/lib/content";
import RichTextEditor from "@/components/admin/RichTextEditor";
import AreasExtra from "@/components/admin/AreasExtra";
import { saveVideoaulas } from "@/app/admin/actions";

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

  const [pendingSave, setPendingSave] = useState(false);

  function updateItem<K extends keyof VideoaulaData>(idx: number, field: K, value: VideoaulaData[K]) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    setSaved(false);
    setPendingSave(true);
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
      const result = await saveVideoaulas(items);
      if (result.ok) { setSaved(true); setPendingSave(false); }
      else setError(result.error);
    });
  }

  async function handleImageUpload(idx: number, file: File) {
    setError(null);
    setUploadingIdx(idx);
    try {
      const blob = await upload(`videoaulas-img/${Date.now()}-${file.name}`, file, {
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
      {/* Unsaved changes banner */}
      {pendingSave && (
        <div className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
          <p className="text-sm text-amber-400 font-medium">
            ⚠ Alterações não salvas — clique em &quot;Salvar videoaulas&quot; para publicar no site.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold text-black transition hover:opacity-90 disabled:opacity-50 shrink-0 ml-4"
          >
            <Save className="h-3.5 w-3.5" />
            {isPending ? "Salvando..." : "Salvar agora"}
          </button>
        </div>
      )}
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

            <AreasExtra value={item.areas} primary={item.area} onChange={(areas) => updateItem(idx, "areas", areas)} />

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
              <RichTextEditor value={item.descricao} onChange={(html) => updateItem(idx, "descricao", html)} />
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

              {/* Enquadramento do vídeo no card (corta as tarjas brancas; ajusta se o personagem ficar fora do centro) */}
              {item.videoUrl && !ytId && (
                <div className="mt-3 rounded-xl border border-accent/30 bg-accent/[0.05] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">
                      📐 Enquadramento do vídeo no card
                    </label>
                    <span className="text-xs font-semibold tabular-nums text-accent">
                      {item.enquadramento ?? 50}% / {item.enquadramentoY ?? 50}% · zoom {item.zoom ?? 100}%
                    </span>
                  </div>
                  <p className="mb-2 text-[11px] leading-relaxed text-white/45">
                    Arraste para mover o recorte. <strong className="text-white/60">Cima/baixo só
                    funciona com o Zoom acima de 100%</strong> (vídeo largo preenche a altura toda;
                    o zoom cria folga). O quadrinho à esquerda mostra como vai ficar no site.
                  </p>

                  {/* Mostrar inteiro — p/ vídeo vertical com legendas (não corta) */}
                  <label className="mb-2 flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-black/20 p-2">
                    <input
                      type="checkbox"
                      checked={!!item.mostrarInteiro}
                      onChange={(e) => {
                        const v = e.target.checked;
                        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, mostrarInteiro: v } : it)));
                        setSaved(false);
                      }}
                      className="mt-0.5 h-4 w-4 accent-[var(--accent,#2ce6b8)]"
                    />
                    <span className="text-[11px] leading-relaxed text-white/70">
                      <strong className="text-white/85">Mostrar vídeo inteiro (não cortar)</strong> — use
                      para vídeo <strong>vertical</strong> ou com <strong>legendas no rodapé</strong>.
                      Mostra tudo, com barras escuras nas laterais. (Desliga o recorte abaixo.)
                    </span>
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-lg bg-black">
                      <video
                        src={`${item.videoUrl}#t=2`}
                        muted
                        playsInline
                        preload="metadata"
                        style={item.mostrarInteiro ? { objectFit: "contain" } : {
                          objectPosition: `${item.enquadramento ?? 50}% 50%`,
                          transform: `scale(${(item.zoom ?? 100) / 100})`,
                          transformOrigin: `50% ${item.enquadramentoY ?? 50}%`,
                        }}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2.5">
                      <div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={item.enquadramento ?? 50}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, enquadramento: v } : it)));
                            setSaved(false);
                          }}
                          className="w-full accent-[var(--accent,#2ce6b8)]"
                        />
                        <div className="mt-1 flex justify-between text-[10px] text-white/30">
                          <span>← Esquerda</span><span>Horizontal</span><span>Direita →</span>
                        </div>
                      </div>
                      <div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={item.enquadramentoY ?? 50}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, enquadramentoY: v } : it)));
                            setSaved(false);
                          }}
                          className="w-full accent-[var(--accent,#2ce6b8)]"
                        />
                        <div className="mt-1 flex justify-between text-[10px] text-white/30">
                          <span>↑ Cima</span><span>Vertical</span><span>Baixo ↓</span>
                        </div>
                      </div>
                      <div>
                        <input
                          type="range"
                          min={100}
                          max={250}
                          value={item.zoom ?? 100}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, zoom: v } : it)));
                            setSaved(false);
                          }}
                          className="w-full accent-[var(--accent,#2ce6b8)]"
                        />
                        <div className="mt-1 flex justify-between text-[10px] text-white/30">
                          <span>🔍 Zoom 100%</span><span>(libera o cima/baixo)</span><span>250%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs text-white/40">Altura da miniatura no site</label>
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
