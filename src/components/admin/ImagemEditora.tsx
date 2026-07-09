"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { getImagemEditora, definirImagemEditora } from "@/app/admin/editora/imagem-actions";

// Imagem/infográfico + tamanho de QUALQUER doc da Editora (protocolo, aula, flashcard,
// questão, pesquisa, comparativo, atualização) — genérico via tabela+docId, mesmo padrão
// do AreasEditora. Aparece no card padrão do conteúdo publicado.
export default function ImagemEditora({ tabela, docId }: { tabela: string; docId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [size, setSize] = useState<number>(176);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    getImagemEditora(tabela, docId).then((r) => {
      if (!vivo || !r.ok) return;
      setUrl(r.data.url);
      setSize(r.data.size ?? 176);
    });
    return () => { vivo = false; };
  }, [tabela, docId]);

  async function enviar(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErro("Envie um arquivo de imagem."); return; }
    setErro(null); setBusy(true);
    try {
      const blob = await upload(`editora-imagem/${Date.now()}-${file.name}`, file, { access: "private", handleUploadUrl: "/api/upload" });
      const r = await definirImagemEditora(tabela, docId, blob.url, size);
      if (r.ok) setUrl(blob.url); else setErro(r.error);
    } catch (e) {
      setErro("Falha no upload: " + (e instanceof Error ? e.message : String(e)));
    }
    setBusy(false);
  }
  async function remover() {
    setErro(null); setBusy(true);
    const r = await definirImagemEditora(tabela, docId, null);
    if (r.ok) setUrl(null); else setErro(r.error);
    setBusy(false);
  }
  function mudarTamanho(v: number) {
    setSize(v);
    if (url) definirImagemEditora(tabela, docId, url, v);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-2">
        <ImagePlus className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold text-white">Imagem / infográfico (opcional)</p>
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />}
      </div>
      <p className="mb-3 text-xs text-white/50">Aparece no card do conteúdo publicado. Sem imagem, o card usa o ícone padrão.</p>
      {url ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-16 w-24 shrink-0 rounded-lg border border-white/10 object-cover" />
            <label className="cursor-pointer rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-accent/40">
              Trocar imagem
              <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => { enviar(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            <button type="button" onClick={remover} disabled={busy} className="inline-flex items-center gap-1 rounded-full border border-rose-400/25 px-3 py-1.5 text-xs font-medium text-rose-300/80 transition hover:text-rose-300 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </button>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs text-white/50">Tamanho no card</label>
              <span className="text-xs font-semibold tabular-nums text-accent">{size}px</span>
            </div>
            <input type="range" min={80} max={400} step={8} value={size} onChange={(e) => mudarTamanho(Number(e.target.value))} className="w-full accent-[var(--accent,#2ce6b8)]" />
          </div>
        </div>
      ) : (
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-accent/40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Enviar imagem
          <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => { enviar(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      )}
      {erro && <p className="mt-2 text-xs text-rose-300">{erro}</p>}
    </div>
  );
}
