"use client";

import { useState, useTransition, useRef } from "react";
import { Save, Upload, Loader2, RotateCcw } from "lucide-react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import type { HeaderData } from "@/lib/content";
import { saveHeader } from "@/app/admin/actions";
import SiteLogo from "@/components/SiteLogo";

type Props = {
  initialHeader: HeaderData;
};

// Linha de slider reutilizável (definida fora do componente p/ não recriar no render).
function RangeRow({
  label,
  value,
  fallback,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number | undefined;
  fallback: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const v = value ?? fallback;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs text-muted">{label}</label>
        <span className="text-xs font-semibold tabular-nums text-accent">
          {v}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent,#2ce6b8)]"
      />
    </div>
  );
}

export default function HeaderEditor({ initialHeader }: Props) {
  const [header, setHeader] = useState<HeaderData>(initialHeader);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update(field: keyof HeaderData, value: string) {
    setHeader((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function setField(field: keyof HeaderData, value: string | number | boolean | undefined) {
    setHeader((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function resetLogoStyle() {
    setHeader((prev) => ({
      name: prev.name,
      cremesp: prev.cremesp,
      rqe1: prev.rqe1,
      rqe2: prev.rqe2,
      logoUrl: prev.logoUrl,
    }));
    setSaved(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setError(null);
    setSaved(false);
    setIsUploading(true);
    try {
      // Upload direto navegador → Vercel Blob (ignora o limite de 1MB das Server Actions)
      const blob = await upload(`logos/${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      });
      const proxyUrl = `/api/img?url=${encodeURIComponent(blob.url)}`;
      const newHeader = { ...header, logoUrl: proxyUrl };
      setHeader(newHeader);
      const saveResult = await saveHeader(newHeader);
      if (saveResult.ok) setSaved(true);
      else setError("Upload OK, mas falhou ao salvar: " + saveResult.error);
    } catch (e) {
      setUploadError("Falha no upload: " + String(e instanceof Error ? e.message : e));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveHeader(header);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            Nome completo
          </label>
          <input
            type="text"
            value={header.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            CRM (ex: CREMESP 76.907)
          </label>
          <input
            type="text"
            value={header.cremesp}
            onChange={(e) => update("cremesp", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            Especialidade 1 — RQE
          </label>
          <input
            type="text"
            value={header.rqe1}
            onChange={(e) => update("rqe1", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            Especialidade 2 — RQE
          </label>
          <input
            type="text"
            value={header.rqe2}
            onChange={(e) => update("rqe2", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
        </div>

        {/* Logo */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.1em] text-muted">
            Logo
          </label>

          {/* Preview atual */}
          {header.logoUrl && (
            <div className="mb-3 flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-xl border border-white/15 bg-black/30">
                <Image
                  src={header.logoUrl}
                  alt="Logo atual"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              <p className="text-xs text-muted">Logo atual</p>
            </div>
          )}

          {/* Botão de upload */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className={`flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.10] ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              {isUploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
              ) : (
                <><Upload className="h-4 w-4" /> Enviar nova logo</>
              )}
            </label>
            <span className="text-xs text-muted">PNG, JPG ou SVG</span>
          </div>

          {uploadError && (
            <p className="mt-2 text-xs text-red-400">{uploadError}</p>
          )}

          {/* URL manual (opcional) */}
          <div className="mt-3">
            <p className="mb-1 text-xs text-muted">Ou cole uma URL externa:</p>
            <input
              type="text"
              value={header.logoUrl}
              onChange={(e) => update("logoUrl", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.1em] text-muted">Preview</p>
          <p className="text-base font-bold text-white">{header.name}</p>
          <p className="text-xs text-accent">{header.cremesp}</p>
          <p className="text-xs text-accent">{header.rqe1}</p>
          <p className="text-xs text-accent">{header.rqe2}</p>
        </div>
      </div>

      {/* ─── Aparência do logo ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-accent/20 bg-accent/[0.04] p-5 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Aparência do logo</h3>
          <p className="mt-1 text-xs text-muted">
            Tamanho, posição, moldura e cores. Para trocar cores específicas do desenho, envie um
            arquivo já editado (campo de upload acima).
          </p>
        </div>

        {/* Prévia ao vivo */}
        <div className="flex items-center justify-center rounded-xl border border-white/10 bg-[#07090f] p-6">
          <SiteLogo header={header} variant="lg" />
        </div>

        {/* Tamanho e posição */}
        <div className="grid gap-4 sm:grid-cols-2">
          <RangeRow label="Tamanho da moldura" value={header.logoSize} fallback={192} min={96} max={224} suffix="px" onChange={(v) => setField("logoSize", v)} />
          <RangeRow label="Logo dentro da moldura" value={header.logoScale} fallback={1} min={0.5} max={1.5} step={0.05} suffix="×" onChange={(v) => setField("logoScale", v)} />
          <RangeRow label="Espaçamento interno" value={header.logoPadding} fallback={14} min={0} max={40} suffix="px" onChange={(v) => setField("logoPadding", v)} />
          <RangeRow label="Arredondamento" value={header.logoRadius} fallback={24} min={0} max={112} suffix="px" onChange={(v) => setField("logoRadius", v)} />
          <RangeRow label="Posição horizontal" value={header.logoOffsetX} fallback={0} min={-16} max={16} suffix="px" onChange={(v) => setField("logoOffsetX", v)} />
          <RangeRow label="Posição vertical" value={header.logoOffsetY} fallback={0} min={-16} max={16} suffix="px" onChange={(v) => setField("logoOffsetY", v)} />
        </div>

        {/* Moldura: cor, borda, sombra */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-muted">Cor de fundo da moldura</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={header.logoBg && header.logoBg !== "transparent" ? header.logoBg : "#ffffff"}
                disabled={header.logoBg === "transparent"}
                onChange={(e) => setField("logoBg", e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-lg border border-white/15 bg-black/30 disabled:opacity-40"
              />
              <label className="flex items-center gap-1.5 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={header.logoBg === "transparent"}
                  onChange={(e) => setField("logoBg", e.target.checked ? "transparent" : "#ffffff")}
                />
                Transparente
              </label>
            </div>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-1.5 text-xs text-white/70">
              <input type="checkbox" checked={header.logoBorder !== false} onChange={(e) => setField("logoBorder", e.target.checked)} />
              Borda
            </label>
            <label className="flex items-center gap-1.5 text-xs text-white/70">
              <input type="checkbox" checked={header.logoShadow !== false} onChange={(e) => setField("logoShadow", e.target.checked)} />
              Brilho / sombra
            </label>
          </div>
        </div>

        {/* Filtros de cor da imagem */}
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.1em] text-muted">Cores da imagem (filtros)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <RangeRow label="Brilho" value={header.logoBrightness} fallback={100} min={0} max={200} suffix="%" onChange={(v) => setField("logoBrightness", v)} />
            <RangeRow label="Contraste" value={header.logoContrast} fallback={100} min={0} max={200} suffix="%" onChange={(v) => setField("logoContrast", v)} />
            <RangeRow label="Saturação" value={header.logoSaturate} fallback={100} min={0} max={200} suffix="%" onChange={(v) => setField("logoSaturate", v)} />
            <RangeRow label="Matiz (girar cores)" value={header.logoHue} fallback={0} min={0} max={360} suffix="°" onChange={(v) => setField("logoHue", v)} />
            <RangeRow label="Preto e branco" value={header.logoGrayscale} fallback={0} min={0} max={100} suffix="%" onChange={(v) => setField("logoGrayscale", v)} />
            <RangeRow label="Inverter cores" value={header.logoInvert} fallback={0} min={0} max={100} suffix="%" onChange={(v) => setField("logoInvert", v)} />
          </div>
        </div>

        <button
          type="button"
          onClick={resetLogoStyle}
          className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Restaurar logo padrão
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || isUploading}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar cabeçalho"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
