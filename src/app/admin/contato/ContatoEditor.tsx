"use client";

import { useState, useTransition } from "react";
import { Save, Upload, Loader2, Trash2, Plus } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { ContatoData } from "@/lib/content";
import { saveContato } from "@/app/admin/actions";

type Props = {
  initialContato: ContatoData;
};

export default function ContatoEditor({ initialContato }: Props) {
  const [contato, setContato] = useState<ContatoData>(initialContato);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  function update(field: keyof ContatoData, value: string) {
    setContato((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleQrUpload(file: File) {
    setError(null);
    setUploadingQr(true);
    try {
      const blob = await upload(`contato/qr-${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      });
      update("qrUrl", `/api/img?url=${encodeURIComponent(blob.url)}`);
    } catch (e) {
      setError("Falha no upload do QR code: " + String(e instanceof Error ? e.message : e));
    } finally {
      setUploadingQr(false);
    }
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveContato(contato);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  // Canais sociais flexíveis (YouTube, TikTok, Telegram, LinkedIn, ...)
  const canais = contato.canais ?? [];
  function setCanais(next: ContatoData["canais"]) {
    setContato((prev) => ({ ...prev, canais: next }));
    setSaved(false);
  }
  function addCanal() {
    setCanais([...canais, { label: "", valor: "", url: "" }]);
  }
  function updateCanal(i: number, field: "label" | "valor" | "url", value: string) {
    setCanais(canais.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }
  function removeCanal(i: number) {
    setCanais(canais.filter((_, idx) => idx !== i));
  }

  const fields: Array<{ key: keyof ContatoData; label: string; placeholder: string; type?: string }> = [
    { key: "email", label: "E-mail", placeholder: "contato@drsandro.com.br", type: "email" },
    { key: "whatsapp", label: "WhatsApp (exibido)", placeholder: "+55 (11) 99999-9999" },
    { key: "whatsappLink", label: "WhatsApp (link)", placeholder: "https://wa.me/5511999999999" },
    { key: "telefone", label: "Telefone (exibido)", placeholder: "+55 (11) 4000-0000" },
    { key: "telefoneLink", label: "Telefone (link)", placeholder: "tel:+551140000000" },
    { key: "instagram", label: "Instagram / Outros (exibido)", placeholder: "Instagram e Telegram" },
    { key: "instagramLink", label: "Instagram / Outros (link)", placeholder: "https://instagram.com/" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        {fields.map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              {label}
            </label>
            <input
              type={type ?? "text"}
              placeholder={placeholder}
              value={(contato[key] as string) ?? ""}
              onChange={(e) => update(key, e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-violet/50"
            />
          </div>
        ))}
      </div>

      {/* Canais sociais extras — YouTube, TikTok, Telegram, LinkedIn, e outros */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <p className="text-sm font-semibold text-white">Canais e redes (opcional)</p>
        <p className="text-xs text-white/45">Adicione quantos quiser: YouTube, TikTok, Telegram, LinkedIn, etc. Aparecem na seção de contato do site. Deixe vazio para não exibir.</p>
        {canais.length === 0 && <p className="text-xs text-white/30">Nenhum canal adicionado.</p>}
        {canais.map((c, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-[1fr_1fr_1.4fr_auto]">
            <input
              type="text" placeholder="Nome (ex.: YouTube)" value={c.label}
              onChange={(e) => updateCanal(i, "label", e.target.value)}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent-violet/50"
            />
            <input
              type="text" placeholder="Exibido (ex.: @drsandro)" value={c.valor}
              onChange={(e) => updateCanal(i, "valor", e.target.value)}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent-violet/50"
            />
            <input
              type="text" placeholder="Link (https://...)" value={c.url}
              onChange={(e) => updateCanal(i, "url", e.target.value)}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent-violet/50"
            />
            <button type="button" onClick={() => removeCanal(i)} className="flex items-center justify-center rounded-lg border border-white/15 px-3 py-2 text-red-300/80 transition hover:border-red-400/40 hover:text-red-300" title="Remover">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addCanal} className="flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white transition hover:bg-white/[0.10]">
          <Plus className="h-3.5 w-3.5" /> Adicionar canal
        </button>
      </div>

      {/* QR code opcional — você gera o QR (WhatsApp, PIX, vCard...) e sobe aqui */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <p className="text-sm font-semibold text-white">QR code (opcional)</p>
        <p className="text-xs text-white/45">Você gera o QR code (WhatsApp, PIX, Instagram, vCard…) e sobe a imagem aqui. Ele aparece na seção de contato do site. Deixe vazio para não exibir.</p>
        <div className="flex items-start gap-4">
          {contato.qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={contato.qrUrl} alt="QR code" className="h-28 w-28 shrink-0 rounded-lg border border-white/15 bg-white object-contain p-1" />
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/15 bg-black/20 text-[10px] text-white/30">sem QR</div>
          )}
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              id="qr-upload"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQrUpload(f); e.target.value = ""; }}
            />
            <label
              htmlFor="qr-upload"
              className={`flex w-fit cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white transition hover:bg-white/[0.10] ${uploadingQr ? "opacity-50 pointer-events-none" : ""}`}
            >
              {uploadingQr ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>) : (<><Upload className="h-3.5 w-3.5" /> {contato.qrUrl ? "Trocar QR code" : "Enviar QR code"}</>)}
            </label>
            {contato.qrUrl && (
              <button type="button" onClick={() => update("qrUrl", "")} className="flex w-fit items-center gap-1.5 text-xs text-red-300/80 transition hover:text-red-300">
                <Trash2 className="h-3.5 w-3.5" /> Remover QR
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Título do QR (opcional)</label>
          <input
            type="text"
            placeholder="Ex.: Fale no WhatsApp"
            value={contato.qrLabel ?? ""}
            onChange={(e) => update("qrLabel", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-violet/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Legenda (opcional)</label>
          <input
            type="text"
            placeholder="Ex.: Aponte a câmera do celular"
            value={contato.qrLegenda ?? ""}
            onChange={(e) => update("qrLegenda", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-violet/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar contato"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
