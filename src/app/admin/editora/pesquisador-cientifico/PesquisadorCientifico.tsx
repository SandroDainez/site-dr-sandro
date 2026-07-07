"use client";

import { useMemo, useState, useTransition } from "react";
import { Trash2, Loader2, Search, Save, AlertTriangle, FileText, X, ShieldCheck, Cpu, CheckCircle2, Library, BookOpen, Plus } from "lucide-react";
import AreasEditora from "@/components/admin/AreasEditora";
import { ESPECIALIDADES_MODULO } from "@/lib/editora/protocolo-estrutura";
import { dataCurta } from "@/lib/format-date";
import { validarSecoes } from "@/lib/ai/citations";
import type { Source, SecaoGerada, Issue } from "@/lib/ai/types";
import { criarDoc, gerar, revisar, salvarVersao, listarVersoes, carregarVersao, publicarDoc, despublicarDoc, arquivarDoc, excluirDoc } from "./actions";
import { CheckCircle2 as CheckPub, Globe, EyeOff, Archive } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "border-white/15 text-white/50" },
  scientific_review: { label: "Em revisão", cls: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  ready_to_publish: { label: "Pronto", cls: "border-inten/30 bg-inten/10 text-inten" },
  published: { label: "Publicado", cls: "border-accent/40 bg-accent/10 text-accent" },
  archived: { label: "Arquivado", cls: "border-white/10 text-white/40" },
};

type Doc = { id: string; title: string; slug: string; status: string; specialty: string; tema: string | null };
type Meta = { provider: string; model: string; tokensIn: number; tokensOut: number; confidence: number; method: string; internos: number; pubmed: number; fromCache: boolean };
type RevisaoUI = { issues: Issue[]; corrigido: SecaoGerada[]; usage: { tokensIn: number; tokensOut: number }; provider: string; model: string };

const inputCls = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/40";
const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-5";

const SEV_CLS: Record<string, string> = {
  alta: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  media: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  baixa: "border-white/15 bg-white/[0.04] text-white/60",
};

function renderSecaoTexto(sec: SecaoGerada): string {
  return sec.afirmacoes.map((a) => a.texto).join("\n");
}

export default function PesquisadorCientifico({ docsIniciais, modo }: { docsIniciais: Doc[]; modo: "mock" | "real" }) {
  const [docs, setDocs] = useState<Doc[]>(docsIniciais);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [novoTema, setNovoTema] = useState("");
  const [especialidade, setEspecialidade] = useState<string>(ESPECIALIDADES_MODULO[0]);
  const [incluirPubmed, setIncluirPubmed] = useState(true);

  const [secoes, setSecoes] = useState<SecaoGerada[]>([]);
  const [evidencias, setEvidencias] = useState<Source[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [gerando, setGerando] = useState(false);
  const [textoEditado, setTextoEditado] = useState<Record<string, string>>({});

  const [revisao, setRevisao] = useState<RevisaoUI | null>(null);
  const [revisando, setRevisando] = useState(false);

  const [salvo, setSalvo] = useState<{ versionNumber: number; confidence: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const [statusAtual, setStatusAtual] = useState<string>("");
  const [versoes, setVersoes] = useState<{ id: string; version_number: number; is_published: boolean; created_at: string }[]>([]);

  const validacao = useMemo(() => (secoes.length ? validarSecoes(secoes, evidencias) : null), [secoes, evidencias]);
  const tema = doc?.tema ?? "";

  async function carregarVersoes(id: string, autoAbrirUltima = false) {
    const r = await listarVersoes(id);
    if (r.ok) {
      setVersoes(r.data);
      // Ao abrir uma pesquisa, recarrega a versão mais recente no editor (senão vinha vazio).
      if (autoAbrirUltima && r.data.length > 0) abrirVersao(r.data[0].id);
    }
  }
  // Reabre o conteúdo de uma versão salva no editor (editar + salvar cria nova versão).
  async function abrirVersao(versionId: string) {
    setError(null);
    const r = await carregarVersao(versionId);
    if (!r.ok) { setError(r.error); return; }
    setSecoes(r.data.secoes);
    setEvidencias(r.data.evidencias);
    if (r.data.especialidade) setEspecialidade(r.data.especialidade);
    const te = r.data.textoEditado && Object.keys(r.data.textoEditado).length
      ? r.data.textoEditado
      : Object.fromEntries(r.data.secoes.map((s) => [s.secao, renderSecaoTexto(s)]));
    setTextoEditado(te);
    setMeta(null); setSalvo(null); setRevisao(null);
  }
  function abrirDoc(d: Doc) {
    setDoc(d); setSecoes([]); setEvidencias([]); setMeta(null); setSalvo(null); setError(null); setRevisao(null); setTextoEditado({});
    setStatusAtual(d.status); carregarVersoes(d.id, true);
  }
  function aplicarStatus(status: string) {
    setStatusAtual(status);
    setDoc((prev) => (prev ? { ...prev, status } : prev));
    setDocs((prev) => prev.map((d) => (doc && d.id === doc.id ? { ...d, status } : d)));
  }
  function publicar() { if (!doc) return; setError(null); startTransition(async () => { const r = await publicarDoc(doc.id); if (r.ok) { aplicarStatus(r.data.status); carregarVersoes(doc.id); } else setError(r.error); }); }
  function despublicar() { if (!doc) return; setError(null); startTransition(async () => { const r = await despublicarDoc(doc.id); if (r.ok) { aplicarStatus(r.data.status); carregarVersoes(doc.id); } else setError(r.error); }); }
  function arquivar() { if (!doc) return; setError(null); startTransition(async () => { const r = await arquivarDoc(doc.id); if (r.ok) { aplicarStatus(r.data.status); carregarVersoes(doc.id); } else setError(r.error); }); }

  function excluir() {
    if (!doc) return;
    if (!window.confirm("Excluir este item? Esta ação não pode ser desfeita.")) return;
    setError(null);
    startTransition(async () => {
      const r = await excluirDoc(doc.id);
      if (r.ok) { setDocs((prev) => prev.filter((d) => d.id !== doc.id)); setDoc(null); }
      else setError(r.error);
    });
  }
  function criarNovo() {
    setError(null);
    startTransition(async () => {
      const r = await criarDoc({ tema: novoTema, especialidadeModulo: especialidade });
      if (r.ok) { setDocs((prev) => [r.data, ...prev]); setNovoTema(""); abrirDoc(r.data); } else setError(r.error);
    });
  }

  async function gerarTudo() {
    if (!doc) return;
    setError(null); setSalvo(null); setRevisao(null); setGerando(true);
    const r = await gerar({ docId: doc.id, incluirPubmed });
    if (!r.ok) { setError(r.error); setGerando(false); return; }
    setSecoes(r.data.secoes); setEvidencias(r.data.evidencias);
    setMeta({ provider: r.data.provider, model: r.data.model, tokensIn: r.data.usage.tokensIn, tokensOut: r.data.usage.tokensOut, confidence: r.data.validacao.confidence, method: r.data.validacao.method, internos: r.data.internos, pubmed: r.data.pubmed, fromCache: r.data.fromCache });
    const te: Record<string, string> = {};
    for (const s of r.data.secoes) te[s.secao] = renderSecaoTexto(s);
    setTextoEditado(te);
    setGerando(false);
  }

  async function revisarAgora() {
    if (!doc || secoes.length === 0) return;
    setError(null); setRevisando(true); setRevisao(null);
    const r = await revisar({ secoes, evidencias });
    if (r.ok) setRevisao({ issues: r.data.issues, corrigido: r.data.corrigido, usage: r.data.usage, provider: r.data.provider, model: r.data.model });
    else setError(r.error);
    setRevisando(false);
  }

  function salvar() {
    if (!doc || secoes.length === 0) return;
    setError(null);
    const geracaoMeta = meta ? { provider: meta.provider, model: meta.model, tokensIn: meta.tokensIn, tokensOut: meta.tokensOut, confidence: meta.confidence, method: meta.method } : undefined;
    const revisaoMeta = revisao ? { provider: revisao.provider, model: revisao.model, tokensIn: revisao.usage.tokensIn, tokensOut: revisao.usage.tokensOut, issues: revisao.issues, corrigido: revisao.corrigido } : undefined;
    startTransition(async () => {
      const r = await salvarVersao({ docId: doc.id, especialidade: doc.specialty, tema, secoes, evidencias, textoEditado, geracao: geracaoMeta, revisao: revisaoMeta });
      if (r.ok) { setSalvo({ versionNumber: r.data.versionNumber, confidence: r.data.validacao.confidence }); carregarVersoes(doc.id); } else setError(r.error);
    });
  }

  const pct = validacao ? Math.round(validacao.confidence * 100) : 0;
  const corConf = pct >= 90 ? "text-accent" : pct >= 70 ? "text-amber-300" : "text-rose-300";
  const genProvider = meta ? `${meta.provider}/${meta.model}` : (modo === "real" ? "deepseek" : "mock");
  const fmt = (n: number) => n.toLocaleString("pt-BR");

  return (
    <div className="space-y-6">
      {/* 1) PERGUNTA / DOC */}
      <div className={card}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">1 · Pergunta de pesquisa</p>
        {doc ? (
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-accent" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{doc.title}</p><p className="text-[11px] text-white/40">{doc.status} · {doc.specialty}</p></div>
            <button type="button" onClick={() => setDoc(null)} className="text-xs text-white/50 hover:text-white">trocar</button>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.length > 0 && (
              <div>
                <label className={labelCls}>Abrir pesquisa existente</label>
                <select className={inputCls} value="" onChange={(e) => { const d = docs.find((x) => x.id === e.target.value); if (d) abrirDoc(d); }}>
                  <option value="">Selecione…</option>
                  {docs.map((d) => <option key={d.id} value={d.id}>{d.title} ({d.status})</option>)}
                </select>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
              <div>
                <label className={labelCls}>Especialidade</label>
                <select className={inputCls} value={especialidade} onChange={(e) => setEspecialidade(e.target.value)}>{ESPECIALIDADES_MODULO.map((e) => <option key={e} value={e}>{e}</option>)}</select>
              </div>
              <div>
                <label className={labelCls}>Nova pergunta / tema</label>
                <input className={inputCls} value={novoTema} onChange={(e) => setNovoTema(e.target.value)} placeholder="Ex.: Corticoide melhora desfecho na SDRA moderada a grave?" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={criarNovo} disabled={busy || novoTema.trim().length < 4} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50"><Plus className="h-4 w-4" /> Criar</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {doc && (
        <>
          {/* 2) BUSCA + SÍNTESE */}
          <div className={card}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">2 · Buscar evidências e sintetizar</p>
            <p className="mb-3 text-[12px] text-white/50">Busca a <strong className="text-white/70">biblioteca interna</strong> (sempre) e o <strong className="text-white/70">PubMed</strong> sobre <em className="text-white/60">“{tema}”</em> e sintetiza a evidência.</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={incluirPubmed} onChange={(e) => setIncluirPubmed(e.target.checked)} className="h-4 w-4 accent-[color:var(--accent)]" /> Incluir PubMed
              </label>
              <button type="button" onClick={gerarTudo} disabled={gerando || busy} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:brightness-75">
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar e sintetizar
              </button>
            </div>
            {meta && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/50">
                <span className="inline-flex items-center gap-1.5 font-medium text-white/70"><Cpu className="h-3.5 w-3.5 text-accent" /> {genProvider}</span>
                <span className="inline-flex items-center gap-1"><Library className="h-3 w-3" /> {meta.internos} internos</span>
                <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" /> {meta.pubmed} PubMed</span>
                {meta.fromCache && <span className="text-white/35">(cache)</span>}
                <span className="ml-auto">tokens: <strong className="text-white/70">{fmt(meta.tokensIn)}</strong> in · <strong className="text-white/70">{fmt(meta.tokensOut)}</strong> out</span>
              </div>
            )}
          </div>

          {/* 3) RESULTADO */}
          {secoes.length > 0 && validacao && (
            <div className={card}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">3 · Síntese (editável)</p>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${corConf}`}>{pct}% <span className="text-xs font-medium text-white/40">confiança</span></p>
                  <p className="text-[11px] text-white/40">{validacao.validadas}/{validacao.totalClinicas} afirmações com citação validada · {validacao.semFonte} sem fonte · {validacao.invalidas} inválidas</p>
                </div>
              </div>

              <div className="space-y-3">
                {secoes.map((sec) => {
                  const itens = validacao.itens.filter((it) => it.secao === sec.secao);
                  const problemas = itens.filter((it) => it.exigeFonte && it.status !== "valida");
                  return (
                    <div key={sec.secao} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="mb-1.5 flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{sec.secao}</p>
                        {problemas.length > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300"><AlertTriangle className="h-3 w-3" /> {problemas.length}</span>}
                      </div>
                      <textarea className={inputCls + " min-h-[64px] resize-y font-mono text-[12px]"} value={textoEditado[sec.secao] ?? renderSecaoTexto(sec)} onChange={(e) => setTextoEditado((prev) => ({ ...prev, [sec.secao]: e.target.value }))} />
                      {problemas.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {problemas.map((p, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-[11px] text-amber-300/80">
                              <X className="h-3 w-3 shrink-0" /> {p.status === "sem_fonte" ? "sem fonte" : p.status === "fonte_inexistente" ? "source_id inexistente" : "âncora não consta na evidência"}: “{p.texto.slice(0, 60)}”
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {evidencias.length > 0 && (
                <details className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[11px] text-white/50">
                  <summary className="cursor-pointer text-white/60">Evidências recuperadas ({evidencias.length})</summary>
                  <ul className="mt-2 space-y-1">
                    {evidencias.map((s) => (
                      <li key={s.id} className="flex items-start gap-2"><span className="shrink-0 font-mono text-accent">[{s.id}]</span><span className="text-white/60">{s.tipo === "pubmed" ? "PubMed" : "Biblioteca"} · {s.titulo}{s.ano ? ` (${s.ano})` : ""}</span></li>
                    ))}
                  </ul>
                </details>
              )}

              {/* ESTÁGIO 2 — REVISÃO */}
              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-white"><ShieldCheck className="h-4 w-4 text-accent" /> Estágio 2 · Revisão {modo === "real" ? "(GPT-4o)" : "(mock)"}</p>
                    <p className="mt-0.5 text-[11px] text-white/45">Confere que cada afirmação tem respaldo real nas evidências (conclusões prudentes, sem extrapolar).</p>
                  </div>
                  <button type="button" onClick={revisarAgora} disabled={revisando || gerando || busy} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50">
                    {revisando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {revisao ? "Revisar de novo" : "Revisar síntese"}
                  </button>
                </div>

                {revisao && (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-[11px] text-white/50">
                      <span className="inline-flex items-center gap-1.5 font-medium text-white/70"><Cpu className="h-3.5 w-3.5 text-accent" /> {revisao.provider}/{revisao.model}</span>
                      <span>{revisao.issues.length} apontamento(s)</span>
                      <span className="ml-auto">tokens: <strong className="text-white/70">{fmt(revisao.usage.tokensIn)}</strong> in · <strong className="text-white/70">{fmt(revisao.usage.tokensOut)}</strong> out</span>
                    </div>
                    {revisao.issues.length === 0 ? (
                      <p className="inline-flex items-center gap-1.5 text-sm text-accent"><CheckCircle2 className="h-4 w-4" /> Nenhum apontamento — o revisor não encontrou problemas.</p>
                    ) : (
                      <ul className="space-y-2">
                        {revisao.issues.map((it, idx) => (
                          <li key={idx} className={`rounded-lg border px-3 py-2 text-[12px] ${SEV_CLS[it.severidade] ?? SEV_CLS.baixa}`}>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{it.severidade}</span>
                              <span className="font-mono text-[10px] uppercase opacity-70">{it.tipo}</span>
                              <span className="min-w-0 flex-1 truncate opacity-80">{it.ref}</span>
                            </div>
                            <p className="mt-1 text-white/80">{it.descricao}</p>
                            {it.sugestao && <p className="mt-0.5 text-white/55"><strong className="text-white/70">Sugestão:</strong> {it.sugestao}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="sticky bottom-4 mt-5 flex items-center gap-3">
                <button type="button" onClick={salvar} disabled={busy || gerando} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent shadow-lg transition hover:brightness-110 disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar como nova versão
                </button>
                {salvo && <span className="text-sm font-medium text-accent">✓ Versão {salvo.versionNumber} salva (confiança {Math.round(salvo.confidence * 100)}%)</span>}
              </div>
            </div>
          )}

          {/* 4) PUBLICAÇÃO */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">4 · Publicação</p>
              {(() => { const s = STATUS_LABEL[statusAtual] ?? STATUS_LABEL.draft; return <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.cls}`}>{s.label}</span>; })()}
            </div>
            {versoes.length === 0 ? (
              <p className="text-sm text-white/40">Salve uma versão para poder publicar.</p>
            ) : (
              <>
              <div className="mb-2 space-y-1.5">
                {versoes.map((v) => (
                  <button key={v.id} type="button" onClick={() => abrirVersao(v.id)} disabled={gerando || busy}
                    className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-sm transition hover:border-accent/40 hover:bg-white/[0.04] disabled:opacity-50">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-white/40" />
                    <span className="text-white/70">Versão {v.version_number}</span>
                    {v.is_published
                      ? <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent"><CheckPub className="h-3 w-3" /> pública (congelada)</span>
                      : <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/45">rascunho</span>}
                    <span className="ml-auto text-[10px] text-white/30">{dataCurta(v.created_at)}</span>
                    <span className="shrink-0 text-[10px] font-medium text-accent/80">abrir p/ editar →</span>
                  </button>
                ))}
              </div>
              <p className="mb-4 text-[11px] text-white/35">Clique numa versão para reabrir o conteúdo no editor. Editar e salvar cria uma nova versão (as anteriores ficam no histórico).</p>
              </>
            )}
            <AreasEditora tabela="research_docs" docId={doc.id} />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={publicar} disabled={busy || versoes.length === 0} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50">
                <Globe className="h-3.5 w-3.5" /> Publicar (versão mais recente)
              </button>
              {statusAtual === "published" && (
                <>
                  <a href={`/pesquisas/${doc.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/75 transition hover:text-white"><Globe className="h-3.5 w-3.5" /> Ver no site</a>
                  <button type="button" onClick={despublicar} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-white/70 transition hover:text-white disabled:opacity-50"><EyeOff className="h-3.5 w-3.5" /> Despublicar</button>
                </>
              )}
              {statusAtual !== "archived" && (
                <button type="button" onClick={arquivar} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-white/50 transition hover:text-white/80 disabled:opacity-50"><Archive className="h-3.5 w-3.5" /> Arquivar</button>
              )}
              <button type="button" onClick={excluir} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/25 px-4 py-1.5 text-xs font-medium text-rose-300/80 transition hover:border-rose-400/50 hover:text-rose-300 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Excluir</button>
            </div>
            <p className="mt-2 text-[11px] text-white/35">Publicar congela a versão (imutável) e mostra a síntese em /pesquisas.</p>
          </div>
        </>
      )}

      {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>}
    </div>
  );
}
