"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { Upload, Copy, Check } from "lucide-react";
import AdminHelp from "@/components/admin/AdminHelp";
import { uploadImage } from "@/app/admin/actions";

export default function AdminImagensPage() {
  const [isPending, startTransition] = useTransition();
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setUploadedUrl(null);
    setCopied(false);

    startTransition(async () => {
      const result = await uploadImage(formData);
      if (result.ok) {
        setUploadedUrl(result.url);
        form.reset();
      } else {
        setError(result.error);
      }
    });
  }

  function copyUrl() {
    if (!uploadedUrl) return;
    navigator.clipboard.writeText(uploadedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Imagens</h1>
        <p className="mt-1 text-sm text-muted">
          Envie imagens e copie o link para usar em outros campos do site.
        </p>
      </div>

      <AdminHelp>Escolha um arquivo de imagem, clique em Enviar e depois em Copiar para pegar o link. Cole esse link onde precisar de uma imagem.</AdminHelp>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              Arquivo de imagem
            </label>
            <input
              ref={fileRef}
              type="file"
              name="file"
              accept="image/*"
              required
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white file:cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isPending ? "Enviando..." : "Fazer upload"}
          </button>

          {error && <p className="text-sm text-red-400 leading-relaxed">{error}</p>}
        </div>
      </form>

      {uploadedUrl && (
        <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-5 space-y-3">
          <p className="text-xs uppercase tracking-[0.1em] text-accent">Upload concluído</p>
          <div className="flex items-start gap-2">
            <code className="flex-1 break-all rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 select-all">
              {uploadedUrl}
            </code>
            <button
              type="button"
              onClick={copyUrl}
              className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-muted">
            Cole esta URL no campo de logo do cabeçalho ou em qualquer campo de imagem.
          </p>
        </div>
      )}
    </div>
  );
}
