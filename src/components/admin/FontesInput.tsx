"use client";

import { useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { Plus, Loader2, FileText, Library, ClipboardPaste, Search, Check, Sparkles, BookOpen } from "lucide-react";
import { extrairTextoPdf } from "@/app/admin/referencias/actions";
import { buscarNaBiblioteca, buscarPorIA, type BibliotecaHit, type IaHit } from "@/app/admin/editora/fontes-actions";

// Ingestão de FONTES em 3 modos: colar texto · enviar PDF (extrai o texto) · buscar na
// biblioteca interna (kb_chunks). Em todos, o resultado é uma fonte {titulo,tipo,autor,ano,texto}
// — as citações continuam validadas contra `texto`. Compartilhado pelos 6 módulos de geração.

export type FonteInput = { titulo: string; tipo: string; autor?: string; ano?: number | null; texto: string };

const inputCls = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-accent/50";

// Agrupa os trechos por FONTE (livro/diretriz), preservando o índice original de cada
// trecho — a busca costuma retornar vários trechos do mesmo livro, e mostrar o título uma
// vez (com os trechos embaixo) evita a impressão de "repetição".
function agruparPorFonte<T extends { titulo: string }>(hits: T[]): [string, { h: T; idx: number }[]][] {
  const grupos = new Map<string, { h: T; idx: number }[]>();
  hits.forEach((h, i) => {
    const k = h.titulo || "Biblioteca";
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push({ h, idx: i });
  });
  return [...grupos.entries()];
}

type Modo = "texto" | "pdf" | "biblioteca" | "ia";
const MODOS: { id: Modo; label: string; icon: typeof FileText }[] = [
  { id: "texto", label: "Colar texto", icon: ClipboardPaste },
  { id: "pdf", label: "Enviar PDF", icon: FileText },
  { id: "biblioteca", label: "Buscar na biblioteca", icon: Library },
  { id: "ia", label: "Buscar por IA (PubMed)", icon: Sparkles },
];

export default function FontesInput({
  tipos,
  onAdd,
  busy,
}: {
  tipos: readonly string[];
  onAdd: (input: FonteInput) => Promise<{ ok: boolean; error?: string }>;
  busy?: boolean;
}) {
  const [modo, setModo] = useState<Modo>("texto");
  // metadados (texto + pdf)
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<string>(tipos[0] ?? "artigo");
  const [autor, setAutor] = useState("");
  const [ano, setAno] = useState("");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, startTransition] = useTransition();

  // pdf
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfNome, setPdfNome] = useState("");

  // biblioteca
  const [q, setQ] = useState("");
  const [libBusy, setLibBusy] = useState(false);
  const [hits, setHits] = useState<BibliotecaHit[]>([]);
  const [addedIdx, setAddedIdx] = useState<Set<number>>(new Set());
  const [addingIdx, setAddingIdx] = useState<number | null>(null);

  // busca por IA (biblioteca interna + PubMed)
  const [qi, setQi] = useState("");
  const [iaBusy, setIaBusy] = useState(false);
  const [iaHits, setIaHits] = useState<IaHit[]>([]);
  const [iaMeta, setIaMeta] = useState<{ internos: number; pubmed: number } | null>(null);
  const [iaAdded, setIaAdded] = useState<Set<number>>(new Set());
  const [iaAdding, setIaAdding] = useState<number | null>(null);

  function limparMeta() { setTitulo(""); setAutor(""); setAno(""); setTexto(""); setPdfNome(""); }

  function addTextoOuPdf() {
    if (texto.trim().length < 10) { setErro("Cole/extraia ao menos um trecho de texto."); return; }
    setErro(null);
    startTransition(async () => {
      const r = await onAdd({ titulo: titulo.trim() || (pdfNome || "Fonte sem título"), tipo, autor: autor || undefined, ano: ano ? parseInt(ano) : null, texto });
      if (r.ok) limparMeta();
      else setErro(r.error ?? "Erro ao adicionar.");
    });
  }

  async function onPickPdf(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf") { setErro("Envie um arquivo PDF."); return; }
    setErro(null); setPdfBusy(true); setPdfNome(file.name);
    try {
      const blob = await upload(`editora-fontes/${Date.now()}-${file.name}`, file, { access: "private", handleUploadUrl: "/api/upload" });
      const ext = await extrairTextoPdf(blob.url);
      if (!ext.ok || !ext.data?.trim()) { setErro(ext.error ?? "Não consegui extrair texto do PDF (pode ser escaneado/imagem)."); setPdfBusy(false); return; }
      setTexto(ext.data);
      if (!titulo.trim()) setTitulo(file.name.replace(/\.pdf$/i, ""));
      if (tipo === (tipos[0] ?? "artigo")) setTipo(tipos.includes("livro") ? "livro" : tipo);
    } catch (e) {
      setErro("Falha no upload/leitura do PDF: " + (e instanceof Error ? e.message : String(e)));
    }
    setPdfBusy(false);
  }

  function buscar() {
    setErro(null); setLibBusy(true); setHits([]); setAddedIdx(new Set());
    startTransition(async () => {
      const r = await buscarNaBiblioteca(q);
      if (r.ok) setHits(r.data);
      else setErro(r.error);
      setLibBusy(false);
    });
  }

  function addHit(h: BibliotecaHit, idx: number) {
    setErro(null); setAddingIdx(idx);
    startTransition(async () => {
      const r = await onAdd({ titulo: h.titulo, tipo: h.tipo || "biblioteca", texto: h.conteudo });
      if (r.ok) setAddedIdx((prev) => new Set(prev).add(idx));
      else setErro(r.error ?? "Erro ao adicionar.");
      setAddingIdx(null);
    });
  }

  function buscarIa() {
    setErro(null); setIaBusy(true); setIaHits([]); setIaAdded(new Set()); setIaMeta(null);
    startTransition(async () => {
      const r = await buscarPorIA(qi);
      if (r.ok) { setIaHits(r.data); setIaMeta({ internos: r.internos, pubmed: r.pubmed }); }
      else setErro(r.error);
      setIaBusy(false);
    });
  }
  function addIaHit(h: IaHit, idx: number) {
    setErro(null); setIaAdding(idx);
    startTransition(async () => {
      const r = await onAdd({ titulo: h.titulo, tipo: h.tipo === "pubmed" ? "artigo" : (h.tipo || "biblioteca"), autor: h.autor, ano: h.ano, texto: h.conteudo });
      if (r.ok) setIaAdded((prev) => new Set(prev).add(idx));
      else setErro(r.error ?? "Erro ao adicionar.");
      setIaAdding(null);
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      {/* abas de modo */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {MODOS.map((m) => {
          const Icon = m.icon;
          const on = modo === m.id;
          return (
            <button key={m.id} type="button" onClick={() => { setModo(m.id); setErro(null); }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-accent/50 bg-accent/15 text-accent" : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"}`}>
              <Icon className="h-3.5 w-3.5" /> {m.label}
            </button>
          );
        })}
      </div>

      {/* metadados (texto + pdf) */}
      {modo !== "biblioteca" && (
        <div className="mb-2 grid gap-2 sm:grid-cols-[1fr_150px_1fr_90px]">
          <input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título da fonte" />
          <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value)}>{tipos.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <input className={inputCls} value={autor} onChange={(e) => setAutor(e.target.value)} placeholder="Autor / sociedade" />
          <input className={inputCls} value={ano} onChange={(e) => setAno(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Ano" inputMode="numeric" />
        </div>
      )}

      {modo === "texto" && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">É contra este texto que as citações são verificadas.</p>
          <textarea className={inputCls + " min-h-[90px] resize-y"} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Cole aqui o texto da diretriz/artigo." />
          <button type="button" onClick={addTextoOuPdf} disabled={busy || salvando || texto.trim().length < 10} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/80 transition hover:border-accent/40 disabled:opacity-50">
            {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Adicionar fonte
          </button>
        </div>
      )}

      {modo === "pdf" && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">Envie um PDF — o texto é extraído automaticamente e vira a fonte. (PDF escaneado/imagem não tem texto extraível.)</p>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/[0.02] px-4 py-6 text-sm text-white/60 transition hover:border-accent/40 hover:text-white">
            {pdfBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando e lendo o PDF…</> : <><FileText className="h-4 w-4" /> {pdfNome ? `Trocar PDF (${pdfNome})` : "Escolher PDF"}</>}
            <input type="file" accept="application/pdf" className="hidden" disabled={pdfBusy} onChange={(e) => onPickPdf(e.target.files?.[0])} />
          </label>
          {texto && (
            <div className="space-y-2">
              <p className="text-[11px] text-accent">✓ Texto extraído: {texto.length.toLocaleString("pt-BR")} caracteres. Confira o título e adicione.</p>
              <textarea className={inputCls + " min-h-[80px] resize-y font-mono text-[11px]"} value={texto} onChange={(e) => setTexto(e.target.value)} />
              <button type="button" onClick={addTextoOuPdf} disabled={busy || salvando} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/80 transition hover:border-accent/40 disabled:opacity-50">
                {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Adicionar fonte
              </button>
            </div>
          )}
        </div>
      )}

      {modo === "biblioteca" && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">Busca no acervo interno do site (RAG). Escolha os trechos que quer usar como fonte.</p>
          <div className="flex gap-2">
            <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") buscar(); }} placeholder="Ex.: manejo da via aérea difícil" />
            <button type="button" onClick={buscar} disabled={libBusy || q.trim().length < 3} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50">
              {libBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
            </button>
          </div>
          {hits.length > 0 && (
            <div className="space-y-3">
              {agruparPorFonte(hits).map(([fonte, itens]) => (
                <div key={fonte}>
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/70">
                    <BookOpen className="h-3 w-3 shrink-0 text-white/40" /> <span className="truncate">{fonte}</span>
                    <span className="shrink-0 text-white/30">· {itens.length} trecho{itens.length > 1 ? "s" : ""}</span>
                  </p>
                  <ul className="space-y-1.5">
                    {itens.map(({ h, idx }) => {
                      const added = addedIdx.has(idx);
                      return (
                        <li key={idx} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-[11px] leading-snug text-white/60">{h.conteudo}</p>
                            <p className="mt-0.5 text-[10px] text-white/30">relevância {Math.round(h.score * 100)}%</p>
                          </div>
                          <button type="button" onClick={() => addHit(h, idx)} disabled={added || addingIdx === idx || busy}
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${added ? "border-accent/40 bg-accent/10 text-accent" : "border-white/15 text-white/70 hover:border-accent/40 hover:text-white"} disabled:opacity-60`}>
                            {addingIdx === idx ? <Loader2 className="h-3 w-3 animate-spin" /> : added ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {added ? "Adicionada" : "Adicionar"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {!libBusy && hits.length === 0 && q && <p className="text-[11px] text-white/35">Sem resultados — tente outros termos.</p>}
        </div>
      )}

      {modo === "ia" && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">A IA busca na <strong className="text-white/60">biblioteca interna</strong> + <strong className="text-white/60">PubMed</strong> (artigos reais, com PMID). Escolha os que quer usar como fonte.</p>
          <div className="flex gap-2">
            <input className={inputCls} value={qi} onChange={(e) => setQi(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") buscarIa(); }} placeholder="Ex.: corticoide na SDRA moderada a grave" />
            <button type="button" onClick={buscarIa} disabled={iaBusy || qi.trim().length < 4} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed">
              {iaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Buscar
            </button>
          </div>
          {iaBusy && <p className="text-[11px] text-white/40">Buscando na biblioteca interna e no PubMed… (pode levar alguns segundos)</p>}
          {iaMeta && <p className="text-[11px] text-white/40">{iaMeta.internos} da biblioteca · {iaMeta.pubmed} do PubMed</p>}
          {iaHits.length > 0 && (
            <ul className="space-y-1.5">
              {iaHits.map((h, i) => {
                const added = iaAdded.has(i);
                const isPub = h.tipo === "pubmed";
                return (
                  <li key={i} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                    <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase ${isPub ? "border-sky-400/30 bg-sky-400/10 text-sky-300" : "border-teal-400/30 bg-teal-400/10 text-teal-300"}`}>{isPub ? <BookOpen className="h-2.5 w-2.5" /> : <Library className="h-2.5 w-2.5" />}{isPub ? "PubMed" : "Biblioteca"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-white/80">{h.titulo}{h.ano ? ` (${h.ano})` : ""}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/50">{h.conteudo}</p>
                    </div>
                    <button type="button" onClick={() => addIaHit(h, i)} disabled={added || iaAdding === i || busy}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${added ? "border-accent/40 bg-accent/10 text-accent" : "border-white/15 text-white/70 hover:border-accent/40 hover:text-white"} disabled:opacity-60`}>
                      {iaAdding === i ? <Loader2 className="h-3 w-3 animate-spin" /> : added ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {added ? "Adicionada" : "Adicionar"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!iaBusy && iaHits.length === 0 && iaMeta && <p className="text-[11px] text-white/35">Sem resultados.</p>}
        </div>
      )}

      {erro && <p className="mt-2 text-[11px] text-rose-300">{erro}</p>}
    </div>
  );
}
