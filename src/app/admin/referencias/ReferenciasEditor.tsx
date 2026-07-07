"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Save, Trash2, Upload, Plus, RefreshCw, FileText, Pencil, X } from "lucide-react";
import { salvarReferencia, salvarReferenciaPdf, excluirReferencia, reindexarAssistente } from "./actions";

export type Ref = { id?: string; titulo: string; tipo?: string; autor?: string; fonte_url?: string; arquivo_url?: string; conteudo?: string; area?: string; ativo?: boolean; _trechos?: number; _chars?: number };

const vazio: Ref = { titulo: "", tipo: "Artigo", autor: "", fonte_url: "", arquivo_url: "", conteudo: "", area: "" };
const inputCls = "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/45";

export default function ReferenciasEditor({ inicial }: { inicial: Ref[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Ref>(vazio);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [reindexando, setReindexando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof Ref, v: Ref[keyof Ref]) => setForm((f) => ({ ...f, [k]: v }));

  async function onPdf(file: File) {
    setErr(null); setMsg(null); setEnviando(true);
    try {
      // Só envia o PDF pro armazenamento. A EXTRAÇÃO do texto acontece no servidor, na
      // hora de salvar (salvarReferenciaPdf) — o texto gigante nunca vem pro navegador.
      const blob = await upload(`referencias/${Date.now()}-${file.name}`, file, { access: "private", handleUploadUrl: "/api/upload" });
      set("arquivo_url", blob.url);
      if (!form.titulo) set("titulo", file.name.replace(/\.pdf$/i, ""));
      setMsg("PDF anexado ✓ — clique em “Adicionar referência” para extrair e salvar (feito no servidor).");
    } catch { setErr("Falha no upload do PDF."); }
    finally { setEnviando(false); }
  }

  function salvar() {
    setErr(null); setMsg(null);
    start(async () => {
      // Com PDF anexado e sem texto colado à mão → extrai e salva no servidor.
      const usaPdf = !!form.arquivo_url && !(form.conteudo && form.conteudo.trim());
      const r = usaPdf ? await salvarReferenciaPdf(form, form.arquivo_url!) : await salvarReferencia(form);
      if (r.ok) {
        setMsg(usaPdf
          ? `Referência salva (${Number((r.data as { chars?: number } | undefined)?.chars ?? 0).toLocaleString("pt-BR")} caracteres extraídos). Agora clique em “Reindexar assistente”.`
          : "Referência salva. Lembre de reindexar o assistente.");
        setForm(vazio); router.refresh();
      } else setErr(r.error ?? "Erro ao salvar.");
    });
  }

  function excluir(id: string) {
    start(async () => { await excluirReferencia(id); router.refresh(); });
  }

  // Reindexa em LOOP: cada chamada processa um lote (resumível) e devolve "pendentes".
  // Repete até a fila zerar, mostrando o progresso — nunca estoura o tempo nem perde material.
  async function reindexar() {
    setErr(null); setMsg(null); setReindexando(true);
    let totalFalhas = 0;
    let concluido = false;
    let houveErro = false;
    let ultimoTotal = 0;
    try {
      // Cada chamada processa um lote curto e RESUMÍVEL; repetimos até a fila zerar.
      // Limite alto p/ aguentar bibliotecas grandes numa só sessão (retoma de onde parou).
      for (let volta = 0; volta < 300; volta++) {
        const r = await reindexarAssistente();
        if (!r.ok) { setErr(r.error ?? "Falha ao reindexar."); houveErro = true; break; }
        const d = (r.data as { falhas?: number; total?: number; pendentes?: number } | undefined) || {};
        totalFalhas += d.falhas ?? 0;
        ultimoTotal = Number(d.total ?? ultimoTotal);
        if (d.pendentes && d.pendentes > 0) {
          setMsg(`Indexando… ${ultimoTotal.toLocaleString("pt-BR")} trechos · ${d.pendentes} material(is) na fila`);
        } else {
          concluido = true;
          setMsg(`✅ Concluído — ${ultimoTotal.toLocaleString("pt-BR")} trechos indexados no total${totalFalhas ? ` · ⚠️ ${totalFalhas} falha(s), reindexe de novo` : ""}.`);
          break;
        }
      }
      if (!concluido && !houveErro) {
        // saiu do loop ainda com fila (biblioteca enorme): nada se perdeu, é só continuar
        setMsg(`Pausado em ${ultimoTotal.toLocaleString("pt-BR")} trechos — clique em “Reindexar” de novo para continuar de onde parou.`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao reindexar.");
    } finally {
      setReindexando(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-accent/[0.04] p-4">
        <p className="text-sm text-white/70">Depois de adicionar/editar referências, <strong className="text-white">reindexe</strong> para o assistente passar a usá-las.</p>
        <button type="button" onClick={reindexar} disabled={reindexando} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${reindexando ? "animate-spin" : ""}`} /> {reindexando ? "Reindexando…" : "Reindexar assistente"}
        </button>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{form.id ? "Editar referência" : "Nova referência"}</h3>
          {form.id && <button type="button" onClick={() => setForm(vazio)} className="text-xs text-white/50 hover:text-white"><X className="inline h-3.5 w-3.5" /> cancelar</button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={labelCls}>Título *</label><input className={inputCls} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Surviving Sepsis Campaign 2021" /></div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select className={inputCls} value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
              <option>Artigo</option><option>Diretriz</option><option>Livro</option><option>Protocolo</option><option>Revisão</option><option>Outro</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Área</label>
            <select className={inputCls} value={form.area} onChange={(e) => set("area", e.target.value)}>
              <option value="">Geral</option><option value="anestesiologia">Anestesiologia</option><option value="terapia_intensiva">Terapia Intensiva</option><option value="emergencias">Emergência</option>
            </select>
          </div>
          <div><label className={labelCls}>Autor(es)</label><input className={inputCls} value={form.autor} onChange={(e) => set("autor", e.target.value)} placeholder="Ex.: Evans L et al." /></div>
          <div><label className={labelCls}>Link da fonte (DOI/site)</label><input className={inputCls} value={form.fonte_url} onChange={(e) => set("fonte_url", e.target.value)} placeholder="https://..." /></div>
        </div>

        {/* PDF */}
        <div>
          <label className={labelCls}>PDF (opcional — extrai o texto automaticamente)</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={enviando} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/70 transition hover:border-accent/40 hover:text-white disabled:opacity-50">
              <Upload className="h-4 w-4" /> {enviando ? "Processando…" : "Enviar PDF"}
            </button>
            {form.arquivo_url && <span className="inline-flex items-center gap-1 text-xs text-accent"><FileText className="h-3.5 w-3.5" /> PDF anexado</span>}
          </div>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPdf(f); e.target.value = ""; }} />
        </div>

        <div>
          <label className={labelCls}>Texto da referência {form.arquivo_url ? "(opcional — será extraído do PDF)" : "(ou envie um PDF acima)"}</label>
          <textarea className={`${inputCls} min-h-40`} value={form.conteudo ?? ""} onChange={(e) => set("conteudo", e.target.value)} placeholder={form.arquivo_url ? "Deixe em branco para extrair automaticamente do PDF no servidor." : "Cole o texto / resumo / trechos relevantes — ou envie um PDF acima."} />
          <p className="mt-1 text-[11px] text-white/35">
            {form.id ? "Editando: deixe em branco para manter o texto já salvo. " : ""}
            {(form.conteudo || "").length.toLocaleString("pt-BR")} caracteres digitados
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={salvar} disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
            {form.id ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {pending ? "Salvando…" : form.id ? "Salvar alterações" : "Adicionar referência"}
          </button>
          {msg && <span className="text-sm text-accent">{msg}</span>}
          {err && <span className="text-sm text-red-400">{err}</span>}
        </div>
      </div>

      {/* Lista */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.12em] text-white/40">Referências cadastradas ({inicial.length})</p>
        {inicial.length === 0 ? (
          <p className="text-sm text-white/40">Nenhuma referência ainda. Adicione livros, artigos, diretrizes ou PDFs acima.</p>
        ) : (
          <div className="space-y-2">
            {inicial.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{r.titulo}</p>
                  <p className="text-xs text-white/45">{r.tipo}{r.autor ? ` · ${r.autor}` : ""}{r.area ? ` · ${r.area}` : ""} · {(r._chars ?? 0).toLocaleString("pt-BR")} car.</p>
                  <p className="mt-1 text-[11px]">
                    {(r._trechos ?? 0) > 0
                      ? <span className="text-accent">✓ {(r._trechos ?? 0).toLocaleString("pt-BR")} trechos indexados</span>
                      : <span className="text-amber-300">⚠ não indexado — clique em “Reindexar”</span>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => setForm(r)} className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white" title="Editar"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => r.id && excluir(r.id)} className="rounded-lg p-1.5 text-white/40 transition hover:bg-red-400/10 hover:text-red-400" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
