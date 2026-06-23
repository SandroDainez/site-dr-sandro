"use client";

import { useState, useTransition, useRef } from "react";
import { Save, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import type { HeaderData } from "@/lib/content";
import { saveHeader } from "@/app/admin/actions";

type Props = {
  initialHeader: HeaderData;
};

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
