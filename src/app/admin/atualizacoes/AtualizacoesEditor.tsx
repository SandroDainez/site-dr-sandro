"use client";

import { useState, useTransition, useRef } from "react";
import { Save, Plus, Trash2, Upload } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { AtualizacaoData } from "@/lib/content";
import RichTextEditor from "@/components/admin/RichTextEditor";
import AreasExtra from "@/components/admin/AreasExtra";
import { saveAtualizacoes } from "@/app/admin/actions";

type Props = {
  initialAtualizacoes: AtualizacaoData[];
};

const areaLabels: Record<AtualizacaoData["area"], string> = {
  emergencias: "Emergências",
  ti: "Terapia Intensiva",
  anestesiologia: "Anestesiologia",
};

const areaColors: Record<AtualizacaoData["area"], string> = {
  emergencias: "text-emerg border-emerg/30",
  ti: "text-inten border-inten/30",
  anestesiologia: "text-anest border-anest/30",
};

export default function AtualizacoesEditor({ initialAtualizacoes }: Props) {
  const [items, setItems] = useState<AtualizacaoData[]>(initialAtualizacoes);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  function updateItem<K extends keyof AtualizacaoData>(idx: number, field: K, value: AtualizacaoData[K]) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    setSaved(false);
  }

  // ---- Helpers do formato "boletim" (tópicos + referências) ----
  function updateTopico(idx: number, ti: number, field: string, value: string) {
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const topicos = [...(it.topicos ?? [])];
      topicos[ti] = { ...topicos[ti], [field]: value };
      return { ...it, topicos };
    }));
    setSaved(false);
  }
  function addTopico(idx: number) {
    setItems((prev) => prev.map((it, i) => (i === idx
      ? { ...it, topicos: [...(it.topicos ?? []), { titulo: "", descricao: "", relevancia_clinica: "", fonte_nome: "", fonte_url: "" }] }
      : it)));
    setSaved(false);
  }
  function removeTopico(idx: number, ti: number) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, topicos: (it.topicos ?? []).filter((_, k) => k !== ti) } : it)));
    setSaved(false);
  }
  function updateFonte(idx: number, fi: number, field: string, value: string) {
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const fontes = [...(it.fontes ?? [])];
      fontes[fi] = { ...fontes[fi], [field]: value };
      return { ...it, fontes };
    }));
    setSaved(false);
  }
  function addFonte(idx: number) {
    setItems((prev) => prev.map((it, i) => (i === idx
      ? { ...it, fontes: [...(it.fontes ?? []), { titulo: "", url: "", journal: "", ano: "", origem: "pubmed" }] }
      : it)));
    setSaved(false);
  }
  function removeFonte(idx: number, fi: number) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, fontes: (it.fontes ?? []).filter((_, k) => k !== fi) } : it)));
    setSaved(false);
  }

  function addItem() {
    const newItem: AtualizacaoData = {
      id: "",
      titulo: "",
      conteudo: "",
      area: "emergencias",
      imageUrl: "",
      imageCaption: "",
      link: "",
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
      const result = await saveAtualizacoes(items);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  async function handleImageUpload(idx: number, file: File) {
    setError(null);
    setUploadingIdx(idx);
    try {
      const blob = await upload(`atualizacoes/${Date.now()}-${file.name}`, file, {
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
                Slug único (sem espaços, ex: acls-2026)
              </label>
              <input
                type="text"
                value={item.id}
                onChange={(e) => updateItem(idx, "id", e.target.value)}
                placeholder="acls-2026"
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
                    updateItem(idx, "area", e.target.value as AtualizacaoData["area"])
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

            <AreasExtra value={item.areas} primary={item.area} onChange={(areas) => updateItem(idx, "areas", areas)} />

            {/* Seletor de formato: card simples OU boletim (igual ao da IA) */}
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-white/40">Formato</label>
              <div className="flex flex-wrap gap-2">
                {([
                  { v: "simples", label: "Card simples", hint: "logo + texto livre" },
                  { v: "boletim", label: "Boletim (igual à IA)", hint: "resumo + tópicos com fonte + referências" },
                ] as const).map((opt) => {
                  const ativo = (item.formato ?? "simples") === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => updateItem(idx, "formato", opt.v)}
                      className={`rounded-xl border px-3.5 py-2 text-left text-sm transition ${ativo ? "border-accent/50 bg-accent/10 text-accent" : "border-white/15 bg-black/30 text-white/60 hover:border-white/30 hover:text-white"}`}
                    >
                      <span className="block font-semibold">{opt.label}</span>
                      <span className="block text-[11px] opacity-70">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {item.formato === "boletim" ? (
              <>
                {/* Resumo */}
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">Resumo da semana</label>
                  <textarea
                    value={item.resumo ?? ""}
                    onChange={(e) => updateItem(idx, "resumo", e.target.value)}
                    rows={3}
                    placeholder="2–3 frases resumindo os destaques."
                    className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
                  />
                </div>

                {/* Tópicos */}
                <div className="space-y-3">
                  <label className="block text-xs uppercase tracking-[0.1em] text-white/40">Tópicos</label>
                  {(item.topicos ?? []).map((t, ti) => (
                    <div key={ti} className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-white/40">Tópico {ti + 1}</span>
                        <button type="button" onClick={() => removeTopico(idx, ti)} className="rounded-md p-1 text-white/40 transition hover:bg-red-400/10 hover:text-red-400" title="Remover tópico"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      <input type="text" value={t.titulo} onChange={(e) => updateTopico(idx, ti, "titulo", e.target.value)} placeholder="Título do tópico" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                      <textarea value={t.descricao} onChange={(e) => updateTopico(idx, ti, "descricao", e.target.value)} rows={2} placeholder="Descrição / o que mudou" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                      <textarea value={t.relevancia_clinica ?? ""} onChange={(e) => updateTopico(idx, ti, "relevancia_clinica", e.target.value)} rows={2} placeholder="Relevância clínica (opcional)" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input type="text" value={t.fonte_nome ?? ""} onChange={(e) => updateTopico(idx, ti, "fonte_nome", e.target.value)} placeholder="Fonte (ex: N Engl J Med, SBA)" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                        <input type="url" value={t.fonte_url ?? ""} onChange={(e) => updateTopico(idx, ti, "fonte_url", e.target.value)} placeholder="URL da fonte (link clicável)" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addTopico(idx)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-2 text-xs text-white/50 transition hover:border-white/40 hover:text-white/80"><Plus className="h-3.5 w-3.5" /> Adicionar tópico</button>
                </div>

                {/* Referências */}
                <div className="space-y-3">
                  <label className="block text-xs uppercase tracking-[0.1em] text-white/40">Referências consultadas (opcional)</label>
                  {(item.fontes ?? []).map((f, fi) => (
                    <div key={fi} className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-white/40">Referência {fi + 1}</span>
                        <button type="button" onClick={() => removeFonte(idx, fi)} className="rounded-md p-1 text-white/40 transition hover:bg-red-400/10 hover:text-red-400" title="Remover referência"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      <input type="text" value={f.titulo} onChange={(e) => updateFonte(idx, fi, "titulo", e.target.value)} placeholder="Título do artigo/documento" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input type="text" value={f.journal ?? ""} onChange={(e) => updateFonte(idx, fi, "journal", e.target.value)} placeholder="Journal/órgão" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                        <input type="text" value={f.ano ?? ""} onChange={(e) => updateFonte(idx, fi, "ano", e.target.value)} placeholder="Ano" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                        <select value={f.origem ?? "pubmed"} onChange={(e) => updateFonte(idx, fi, "origem", e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-accent/50">
                          <option value="pubmed">PubMed</option>
                          <option value="rss">Journal</option>
                          <option value="sociedade">Sociedade</option>
                          <option value="regulatorio">Regulatório</option>
                        </select>
                      </div>
                      <input type="url" value={f.url} onChange={(e) => updateFonte(idx, fi, "url", e.target.value)} placeholder="URL (link clicável)" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                    </div>
                  ))}
                  <button type="button" onClick={() => addFonte(idx)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-2 text-xs text-white/50 transition hover:border-white/40 hover:text-white/80"><Plus className="h-3.5 w-3.5" /> Adicionar referência</button>
                </div>
              </>
            ) : (
            <>
            {/* conteudo */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                Conteúdo
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt="Preview"
                    className="h-28 w-auto rounded-xl border border-white/10 object-cover"
                  />
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs text-white/40">Tamanho do logo (ao lado do título)</label>
                      <span className="text-xs font-semibold tabular-nums text-accent">{item.imageSize ?? 56}px</span>
                    </div>
                    <input
                      type="range"
                      min={32}
                      max={160}
                      value={item.imageSize ?? 56}
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

            {/* link */}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-white/40">
                Link externo (opcional)
              </label>
              <input
                type="url"
                value={item.link}
                onChange={(e) => updateItem(idx, "link", e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
              />
            </div>
            </>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-3 text-sm text-white/50 transition hover:border-white/40 hover:text-white/80"
      >
        <Plus className="h-4 w-4" />
        Adicionar atualização
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar atualizações"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
