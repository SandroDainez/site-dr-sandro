"use client";

import { useState, useTransition } from "react";
import { Plus, Save, Trash2, Loader2, Upload, X, Sparkles, ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { upload } from "@vercel/blob/client";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { ARTIGO_ESPECIALIDADES, type Artigo } from "@/lib/editora";
import { salvarArtigo, excluirArtigo, gerarArtigoIA } from "./actions";

type Form = Partial<Artigo>;
const VAZIO: Form = { titulo: "", autor: "", especialidade: "geral", resumo: "", corpo: "", capa_url: "", status: "rascunho" };

const inputCls = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/40";

function espLabel(v?: string) {
  return ARTIGO_ESPECIALIDADES.find((e) => e.value === v)?.label ?? "Geral";
}

export default function EditoraManager({ initial }: { initial: Artigo[] }) {
  const [artigos, setArtigos] = useState<Artigo[]>(initial);
  const [form, setForm] = useState<Form | null>(null); // null = lista; objeto = editor
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tema, setTema] = useState("");
  const [gerando, setGerando] = useState(false);

  function up(patch: Form) { setForm((f) => ({ ...(f ?? {}), ...patch })); setSaved(false); }

  function novo() { setForm({ ...VAZIO }); setTema(""); setError(null); setSaved(false); }
  function editar(a: Artigo) { setForm({ ...a }); setTema(""); setError(null); setSaved(false); }
  function voltar() { setForm(null); setError(null); }

  async function uploadCapa(file: File) {
    setError(null);
    setUploading(true);
    try {
      const blob = await upload(`editora/capa-${Date.now()}-${file.name}`, file, { access: "private", handleUploadUrl: "/api/upload" });
      up({ capa_url: `/api/img?url=${encodeURIComponent(blob.url)}` });
    } catch (e) {
      setError("Falha no upload da capa: " + String(e instanceof Error ? e.message : e));
    } finally {
      setUploading(false);
    }
  }

  function gerar() {
    setError(null);
    setGerando(true);
    startTransition(async () => {
      const res = await gerarArtigoIA(tema, form?.especialidade ?? "geral");
      setGerando(false);
      if (res.ok && res.data) {
        up({
          titulo: form?.titulo?.trim() ? form.titulo : res.data.titulo,
          resumo: res.data.resumo,
          corpo: res.data.corpo,
        });
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  function salvar() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await salvarArtigo(form);
      if (res.ok && res.data) {
        const a = res.data;
        setArtigos((prev) => {
          const i = prev.findIndex((x) => x.id === a.id);
          if (i >= 0) { const n = [...prev]; n[i] = a; return n; }
          return [a, ...prev];
        });
        setForm({ ...a });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  function excluir(id?: string) {
    if (!id) { voltar(); return; }
    if (!confirm("Excluir este artigo? Não dá para desfazer.")) return;
    setError(null);
    startTransition(async () => {
      const res = await excluirArtigo(id);
      if (res.ok) {
        setArtigos((prev) => prev.filter((x) => x.id !== id));
        voltar();
      } else {
        setError(res.error);
      }
    });
  }

  // ── LISTA ────────────────────────────────────────────────────────────────
  if (!form) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={novo} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:brightness-110">
          <Plus className="h-4 w-4" /> Novo artigo
        </button>

        {artigos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center text-sm text-white/50">
            Nenhum artigo ainda. Clique em “Novo artigo”.
          </div>
        ) : (
          <div className="space-y-2">
            {artigos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${a.status === "publicado" ? "border-accent/40 bg-accent/10 text-accent" : "border-amber-400/40 bg-amber-400/10 text-amber-300"}`}>
                      {a.status === "publicado" ? "Publicado" : "Rascunho"}
                    </span>
                    <span className="text-[11px] text-white/40">{espLabel(a.especialidade)}{a.autor ? ` · ${a.autor}` : ""}</span>
                  </div>
                  <p className="truncate text-sm font-medium text-white">{a.titulo}</p>
                </div>
                {a.status === "publicado" && (
                  <a href={`/artigos/${a.slug}`} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg border border-white/10 p-2 text-white/50 transition hover:text-white" title="Ver no site"><ExternalLink className="h-4 w-4" /></a>
                )}
                <button type="button" onClick={() => editar(a)} className="shrink-0 rounded-lg border border-white/10 p-2 text-white/60 transition hover:text-white" title="Editar"><Pencil className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── EDITOR ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <button type="button" onClick={voltar} className="inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Voltar à lista
      </button>

      {/* Gerar com IA */}
      <div className="rounded-2xl border border-accent/25 bg-accent/[0.05] p-4">
        <label className={labelCls}>Gerar rascunho com IA (opcional)</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className={inputCls} value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Tema do artigo. Ex.: Manejo inicial da sepse na emergência" />
          <button type="button" onClick={gerar} disabled={gerando || isPending || tema.trim().length < 3} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent/20 border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/30 disabled:opacity-50">
            {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-white/40">Preenche título, resumo e corpo. Você revisa antes de salvar. A IA não inventa doses/números incertos — orienta confirmar na diretriz.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <div>
          <label className={labelCls}>Título</label>
          <input className={inputCls} value={form.titulo ?? ""} onChange={(e) => up({ titulo: e.target.value })} placeholder="Título do artigo" />
        </div>
        <div>
          <label className={labelCls}>Área</label>
          <select className={inputCls} value={form.especialidade ?? "geral"} onChange={(e) => up({ especialidade: e.target.value as Artigo["especialidade"] })}>
            {ARTIGO_ESPECIALIDADES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Autor (crédito)</label>
        <input className={inputCls} value={form.autor ?? ""} onChange={(e) => up({ autor: e.target.value })} placeholder="Ex.: Dr. Sandro Dainez" />
      </div>

      <div>
        <label className={labelCls}>Resumo (aparece no card e no topo)</label>
        <textarea className={inputCls + " min-h-[70px] resize-y"} value={form.resumo ?? ""} onChange={(e) => up({ resumo: e.target.value })} placeholder="2-3 frases resumindo o artigo." />
      </div>

      <div>
        <label className={labelCls}>Corpo do artigo</label>
        <RichTextEditor value={form.corpo ?? ""} onChange={(html) => up({ corpo: html })} />
      </div>

      {/* Capa */}
      <div>
        <label className={labelCls}>Capa (opcional)</label>
        <div className="flex items-center gap-3">
          {form.capa_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.capa_url} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/15 text-[10px] text-white/30">sem capa</div>
          )}
          <input type="file" accept="image/*" id="capa-up" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCapa(f); e.target.value = ""; }} />
          <label htmlFor="capa-up" className={`flex w-fit cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.10] ${uploading ? "pointer-events-none opacity-50" : ""}`}>
            {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</> : <><Upload className="h-3.5 w-3.5" /> {form.capa_url ? "Trocar capa" : "Enviar capa"}</>}
          </label>
          {form.capa_url && <button type="button" onClick={() => up({ capa_url: "" })} className="flex items-center gap-1 text-xs text-white/50 transition hover:text-white/80"><X className="h-3 w-3" /> Remover</button>}
        </div>
      </div>

      <div>
        <label className={labelCls}>Status</label>
        <select className={inputCls + " sm:max-w-xs"} value={form.status ?? "rascunho"} onChange={(e) => up({ status: e.target.value as Artigo["status"] })}>
          <option value="rascunho">Rascunho (não aparece no site)</option>
          <option value="publicado">Publicado (visível em /artigos)</option>
        </select>
      </div>

      {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>}

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={salvar} disabled={isPending} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent shadow-lg transition hover:brightness-110 disabled:opacity-60">
          {isPending && !gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
        </button>
        {saved && <span className="text-sm font-medium text-accent">✓ Salvo</span>}
        {form.id && form.status === "publicado" && (
          <a href={`/artigos/${form.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/70 transition hover:text-white"><ExternalLink className="h-3.5 w-3.5" /> Ver no site</a>
        )}
        {form.id && (
          <button type="button" onClick={() => excluir(form.id)} disabled={isPending} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 px-4 py-2 text-xs font-medium text-rose-400/80 transition hover:bg-rose-400/10 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /> Excluir</button>
        )}
      </div>
    </div>
  );
}
