"use client";

import { useState, useTransition } from "react";
import {
  Save, Plus, Trash2, Upload, ChevronDown, ChevronUp,
  Video, FileText, Presentation, BookOpen,
} from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { CursoData, CursoAula, CursoMaterial } from "@/lib/content";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { saveCursos } from "@/app/admin/actions";

type Props = { initialCursos: CursoData[] };

const inputCls =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/40";

const areaOptions: { v: CursoData["area"]; l: string }[] = [
  { v: "emergencias", l: "Emergências" },
  { v: "ti", l: "Terapia Intensiva" },
  { v: "anestesiologia", l: "Anestesiologia" },
  { v: "geral", l: "Geral" },
];

const materialTipos: { v: CursoMaterial["tipo"]; l: string; icon: typeof Video }[] = [
  { v: "video", l: "Vídeo", icon: Video },
  { v: "slides", l: "Slides", icon: Presentation },
  { v: "pdf", l: "PDF", icon: FileText },
  { v: "ebook", l: "E-book", icon: BookOpen },
];

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CursosEditor({ initialCursos }: Props) {
  const [cursos, setCursos] = useState<CursoData[]>(initialCursos);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  function touch() {
    setSaved(false);
  }

  function toggleOpen(id: string) {
    setOpen((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function updateCurso(ci: number, patch: Partial<CursoData>) {
    setCursos((prev) => prev.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
    touch();
  }

  function addCurso() {
    const id = uid("curso");
    const novo: CursoData = {
      id: "",
      titulo: "",
      resumo: "",
      descricao: "",
      area: "geral",
      nivel: "",
      professor: "",
      capaUrl: "",
      acesso: "gratis",
      preco: "",
      destaque: false,
      aulas: [],
      data: new Date().toISOString().slice(0, 10),
    };
    setCursos((prev) => [...prev, novo]);
    setOpen((p) => new Set(p).add(id));
    touch();
  }

  function removeCurso(ci: number) {
    if (!confirm("Remover este curso e todas as suas aulas?")) return;
    setCursos((prev) => prev.filter((_, i) => i !== ci));
    touch();
  }

  function moveCurso(ci: number, dir: -1 | 1) {
    setCursos((prev) => {
      const next = [...prev];
      const j = ci + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[ci], next[j]] = [next[j], next[ci]];
      return next;
    });
    touch();
  }

  // ── Aulas ──────────────────────────────────────────────
  function setAulas(ci: number, fn: (a: CursoAula[]) => CursoAula[]) {
    setCursos((prev) => prev.map((c, i) => (i === ci ? { ...c, aulas: fn(c.aulas) } : c)));
    touch();
  }

  function addAula(ci: number) {
    setAulas(ci, (a) => [...a, { id: uid("aula"), titulo: "", descricao: "", materiais: [] }]);
  }

  function updateAula(ci: number, ai: number, patch: Partial<CursoAula>) {
    setAulas(ci, (a) => a.map((x, i) => (i === ai ? { ...x, ...patch } : x)));
  }

  function removeAula(ci: number, ai: number) {
    setAulas(ci, (a) => a.filter((_, i) => i !== ai));
  }

  function moveAula(ci: number, ai: number, dir: -1 | 1) {
    setAulas(ci, (a) => {
      const next = [...a];
      const j = ai + dir;
      if (j < 0 || j >= next.length) return a;
      [next[ai], next[j]] = [next[j], next[ai]];
      return next;
    });
  }

  // ── Materiais ──────────────────────────────────────────
  function setMateriais(ci: number, ai: number, fn: (m: CursoMaterial[]) => CursoMaterial[]) {
    setAulas(ci, (a) => a.map((x, i) => (i === ai ? { ...x, materiais: fn(x.materiais) } : x)));
  }

  function addMaterial(ci: number, ai: number, tipo: CursoMaterial["tipo"]) {
    setMateriais(ci, ai, (m) => [...m, { id: uid("mat"), tipo, titulo: "", url: "" }]);
  }

  function updateMaterial(ci: number, ai: number, mi: number, patch: Partial<CursoMaterial>) {
    setMateriais(ci, ai, (m) => m.map((x, i) => (i === mi ? { ...x, ...patch } : x)));
  }

  function removeMaterial(ci: number, ai: number, mi: number) {
    setMateriais(ci, ai, (m) => m.filter((_, i) => i !== mi));
  }

  // ── Upload (capa + materiais) — input próprio por campo (acionado por <label>) ──
  async function handleUpload(key: string, file: File, apply: (url: string) => void) {
    setError(null);
    setUploadingKey(key);
    try {
      const blob = await upload(`cursos/${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      });
      apply(`/api/img?url=${encodeURIComponent(blob.url)}`);
    } catch (e) {
      setError("Falha no upload: " + String(e instanceof Error ? e.message : e));
    } finally {
      setUploadingKey(null);
    }
  }

  function handleSave() {
    setError(null);
    // valida slugs
    const cleaned = cursos.map((c) => ({ ...c, id: c.id.trim() || slugify(c.titulo) }));
    const ids = cleaned.map((c) => c.id);
    const dup = ids.find((id, i) => id && ids.indexOf(id) !== i);
    if (dup) {
      setError(`Slug duplicado: "${dup}". Cada curso precisa de um slug único.`);
      return;
    }
    setCursos(cleaned);
    startTransition(async () => {
      const r = await saveCursos(cleaned);
      if (r.ok) setSaved(true);
      else setError(r.error);
    });
  }

  return (
    <div className="space-y-4">

      {cursos.map((curso, ci) => {
        const cid = curso.id || `idx-${ci}`;
        const isOpen = open.has(cid) || open.has(curso.id);
        return (
          <div key={ci} className="rounded-2xl border border-white/10 bg-white/[0.03]">
            {/* Cabeçalho do curso */}
            <div className="flex items-center gap-2 p-4">
              <button
                type="button"
                onClick={() => toggleOpen(curso.id || cid)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                {curso.capaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={curso.capaUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/30">
                    <Video className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {curso.titulo || "Novo curso"}
                  </p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {curso.aulas.length} aula{curso.aulas.length !== 1 ? "s" : ""} ·{" "}
                    {curso.acesso === "gratis" ? "Gratuito" : "Pago 🔒"}
                  </p>
                </div>
              </button>
              <button type="button" onClick={() => moveCurso(ci, -1)} className="rounded-lg p-1.5 text-white/30 hover:bg-white/10 hover:text-white" title="Subir">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => moveCurso(ci, 1)} className="rounded-lg p-1.5 text-white/30 hover:bg-white/10 hover:text-white" title="Descer">
                <ChevronDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => removeCurso(ci)} className="rounded-lg p-1.5 text-white/40 hover:bg-red-400/10 hover:text-red-400" title="Remover curso">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {isOpen && (
              <div className="space-y-4 border-t border-white/10 p-5">
                {/* Título + slug */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Título</label>
                    <input className={inputCls} value={curso.titulo} onChange={(e) => updateCurso(ci, { titulo: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Slug (URL única)</label>
                    <input
                      className={inputCls}
                      value={curso.id}
                      placeholder="ventilacao-mecanica"
                      onChange={(e) => updateCurso(ci, { id: slugify(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Resumo */}
                <div>
                  <label className={labelCls}>Resumo (frase no card)</label>
                  <input className={inputCls} value={curso.resumo} onChange={(e) => updateCurso(ci, { resumo: e.target.value })} placeholder="Do básico ao avançado, com casos clínicos." />
                </div>

                {/* área / nível / professor */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Área</label>
                    <select className={inputCls} value={curso.area} onChange={(e) => updateCurso(ci, { area: e.target.value as CursoData["area"] })}>
                      {areaOptions.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Nível</label>
                    <select className={inputCls} value={curso.nivel} onChange={(e) => updateCurso(ci, { nivel: e.target.value as CursoData["nivel"] })}>
                      <option value="">—</option>
                      <option value="basico">Básico</option>
                      <option value="intermediario">Intermediário</option>
                      <option value="avancado">Avançado</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Professor</label>
                    <input className={inputCls} value={curso.professor} onChange={(e) => updateCurso(ci, { professor: e.target.value })} placeholder="Dr. Sandro Dainez" />
                  </div>
                </div>

                {/* acesso / preço / destaque */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Acesso</label>
                    <select className={inputCls} value={curso.acesso} onChange={(e) => updateCurso(ci, { acesso: e.target.value as CursoData["acesso"] })}>
                      <option value="gratis">Gratuito</option>
                      <option value="pago">Pago (🔒 em breve)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Preço (p/ depois)</label>
                    <input className={inputCls} value={curso.preco} onChange={(e) => updateCurso(ci, { preco: e.target.value })} placeholder="R$ 297" disabled={curso.acesso === "gratis"} />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                      <input type="checkbox" checked={curso.destaque} onChange={(e) => updateCurso(ci, { destaque: e.target.checked })} className="h-4 w-4 accent-[var(--accent,#2ce6b8)]" />
                      Destaque na home
                    </label>
                  </div>
                </div>

                {/* Capa */}
                <div>
                  <label className={labelCls}>Capa do curso</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      id={`capa-file-${ci}`}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(`capa-${ci}`, f, (url) => updateCurso(ci, { capaUrl: url }));
                        e.target.value = "";
                      }}
                    />
                    <label
                      htmlFor={`capa-file-${ci}`}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/70 transition hover:border-accent/40 hover:text-white ${uploadingKey === `capa-${ci}` ? "pointer-events-none opacity-50" : ""}`}
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingKey === `capa-${ci}` ? "Enviando..." : "Enviar capa"}
                    </label>
                    {curso.capaUrl && (
                      <button type="button" onClick={() => updateCurso(ci, { capaUrl: "" })} className="text-xs text-red-400/70 hover:text-red-400">Remover</button>
                    )}
                  </div>
                  {curso.capaUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={curso.capaUrl} alt="" className="mt-2 h-28 w-auto rounded-xl border border-white/10 object-cover" />
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className={labelCls}>Sobre o curso</label>
                  <RichTextEditor value={curso.descricao} onChange={(html) => updateCurso(ci, { descricao: html })} />
                </div>

                {/* ── Aulas ── */}
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent/80">
                      Aulas ({curso.aulas.length})
                    </p>
                  </div>

                  <div className="space-y-3">
                    {curso.aulas.map((aula, ai) => (
                      <div key={aula.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">{ai + 1}</span>
                          <input
                            className={inputCls + " flex-1"}
                            value={aula.titulo}
                            placeholder={`Título da aula ${ai + 1}`}
                            onChange={(e) => updateAula(ci, ai, { titulo: e.target.value })}
                          />
                          <button type="button" onClick={() => moveAula(ci, ai, -1)} className="rounded p-1 text-white/30 hover:text-white" title="Subir"><ChevronUp className="h-4 w-4" /></button>
                          <button type="button" onClick={() => moveAula(ci, ai, 1)} className="rounded p-1 text-white/30 hover:text-white" title="Descer"><ChevronDown className="h-4 w-4" /></button>
                          <button type="button" onClick={() => removeAula(ci, ai)} className="rounded p-1 text-white/40 hover:text-red-400" title="Remover aula"><Trash2 className="h-4 w-4" /></button>
                        </div>

                        <div className="mb-3">
                          <label className={labelCls}>Descrição da aula</label>
                          <RichTextEditor value={aula.descricao} onChange={(html) => updateAula(ci, ai, { descricao: html })} />
                        </div>

                        {/* Materiais */}
                        <div className="space-y-2">
                          {aula.materiais.map((mat, mi) => {
                            const isUp = uploadingKey === `mat-${ci}-${ai}-${mi}`;
                            const accept = mat.tipo === "video" ? "video/*" : mat.tipo === "slides" ? "application/pdf,image/*" : "application/pdf";
                            return (
                              <div key={mat.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                                <div className="flex items-center gap-2">
                                  <select
                                    className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white outline-none"
                                    value={mat.tipo}
                                    onChange={(e) => updateMaterial(ci, ai, mi, { tipo: e.target.value as CursoMaterial["tipo"] })}
                                  >
                                    {materialTipos.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                                  </select>
                                  <input
                                    className={inputCls + " flex-1"}
                                    value={mat.titulo}
                                    placeholder="Nome do material"
                                    onChange={(e) => updateMaterial(ci, ai, mi, { titulo: e.target.value })}
                                  />
                                  <button type="button" onClick={() => removeMaterial(ci, ai, mi)} className="rounded p-1 text-white/40 hover:text-red-400" title="Remover material"><Trash2 className="h-4 w-4" /></button>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <input
                                    className={inputCls + " flex-1"}
                                    value={mat.url}
                                    placeholder={mat.tipo === "video" ? "Cole um link do YouTube aqui (ou envie do PC →)" : "Envie o arquivo do PC →"}
                                    onChange={(e) => updateMaterial(ci, ai, mi, { url: e.target.value })}
                                  />
                                  <input
                                    type="file"
                                    accept={accept}
                                    id={`mat-file-${ci}-${ai}-${mi}`}
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleUpload(`mat-${ci}-${ai}-${mi}`, f, (url) => updateMaterial(ci, ai, mi, { url }));
                                      e.target.value = "";
                                    }}
                                  />
                                  <label
                                    htmlFor={`mat-file-${ci}-${ai}-${mi}`}
                                    className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20 ${isUp ? "pointer-events-none opacity-50" : ""}`}
                                  >
                                    <Upload className="h-3.5 w-3.5" />
                                    {isUp ? "Enviando..." : mat.tipo === "video" ? "Enviar do PC" : "Enviar arquivo"}
                                  </label>
                                </div>
                                {mat.url && (
                                  <p className="mt-1.5 truncate text-[11px] text-white/40">✓ {mat.url.includes("youtu") ? "Link do YouTube salvo" : "Arquivo enviado"}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Adicionar material */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {materialTipos.map((t) => (
                            <button
                              key={t.v}
                              type="button"
                              onClick={() => addMaterial(ci, ai, t.v)}
                              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-xs text-white/60 transition hover:border-accent/40 hover:text-white"
                            >
                              <t.icon className="h-3.5 w-3.5" /> + {t.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addAula(ci)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-2.5 text-sm text-white/50 transition hover:border-white/40 hover:text-white/80"
                  >
                    <Plus className="h-4 w-4" /> Adicionar aula
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addCurso}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-3 text-sm text-white/50 transition hover:border-white/40 hover:text-white/80"
      >
        <Plus className="h-4 w-4" /> Adicionar curso
      </button>

      <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0e14]/90 p-3 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar cursos"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
