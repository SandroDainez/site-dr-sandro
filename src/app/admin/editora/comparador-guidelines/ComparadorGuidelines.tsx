"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Trash2, Loader2, GitCompare, Save, AlertTriangle, FileText, X, ShieldCheck, Cpu, CheckCircle2, Library, BookOpen, Plus, PencilLine, Wand2 } from "lucide-react";
import AreasEditora from "@/components/admin/AreasEditora";
import { ESPECIALIDADES_MODULO } from "@/lib/editora/protocolo-estrutura";
import { dataCurta } from "@/lib/format-date";
import { validarSecoes } from "@/lib/ai/citations";
import type { Source, SecaoGerada, Issue } from "@/lib/ai/types";
import { criarDoc, gerar, revisar, salvarVersao, listarVersoes, carregarVersao, excluirVersao, publicarDoc, despublicarDoc, arquivarDoc, excluirDoc, aplicarCorrecoes } from "./actions";
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

export default function ComparadorGuidelines({ docsIniciais, modo }: { docsIniciais: Doc[]; modo: "mock" | "real" }) {
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

  // aplicar correções da IA (reancorar afirmações reprovadas)
  const [corrigindo, setCorrigindo] = useState(false);
  const [correcao, setCorrecao] = useState<{ corrigidas: number; total: number; antes: number; depois: number } | null>(null);

  const [salvo, setSalvo] = useState<{ versionNumber: number; confidence: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const [editandoVersao, setEditandoVersao] = useState<number | null>(null); // modo edição focado

  const [statusAtual, setStatusAtual] = useState<string>("");
  const [versoes, setVersoes] = useState<{ id: string; version_number: number; is_published: boolean; created_at: string }[]>([]);

  const validacao = useMemo(() => (secoes.length ? validarSecoes(secoes, evidencias) : null), [secoes, evidencias]);
  const tema = doc?.tema ?? "";

  async function carregarVersoes(id: string, autoAbrirUltima = false) {
    const r = await listarVersoes(id);
    if (r.ok) {
      setVersoes(r.data);
      // Ao abrir um comparativo, recarrega a versão mais recente no editor (senão vinha vazio;
      // SEM entrar no modo edição focado).
      if (autoAbrirUltima && r.data.length > 0) abrirVersao(r.data[0].id, r.data[0].version_number, false);
    }
  }
  // Validação MANUAL: o médico marca uma afirmação (posição de fonte) como "conferi na fonte"
  // (resolve o aviso sem citação verbatim). Fica gravado na versão ao salvar.
  function aceitarAfirmacao(si: number, ai: number, valor: boolean) {
    setSecoes((prev) => prev.map((s, i) => (i !== si ? s : {
      ...s, afirmacoes: s.afirmacoes.map((a, j) => (j !== ai ? a : { ...a, conferido: valor })),
    })));
  }
  function excluirVersaoClick(versionId: string, versionNumber: number) {
    if (!doc) return;
    if (!window.confirm(`Excluir a Versão ${versionNumber}? Esta ação não pode ser desfeita.`)) return;
    setError(null);
    startTransition(async () => {
      const r = await excluirVersao({ docId: doc.id, versionId });
      if (r.ok) { carregarVersoes(doc.id); if (editandoVersao === versionNumber) setEditandoVersao(null); }
      else setError(r.error);
    });
  }
  // Reabre o conteúdo de uma versão salva no editor (editar + salvar cria nova versão).
  // foco=true → entra no MODO EDIÇÃO focado (esconde busca/geração, mostra banner).
  const resultadoRef = useRef<HTMLDivElement>(null);
  async function abrirVersao(versionId: string, versionNumber?: number, foco = false) {
    setError(null);
    const r = await carregarVersao(versionId);
    if (!r.ok) { setError(r.error); return; }
    setEditandoVersao(foco ? (versionNumber ?? null) : null);
    setSecoes(r.data.secoes); setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    setEvidencias(r.data.evidencias);
    const te = r.data.textoEditado && Object.keys(r.data.textoEditado).length
      ? r.data.textoEditado
      : Object.fromEntries(r.data.secoes.map((s) => [s.secao, renderSecaoTexto(s)]));
    setTextoEditado(te);
    if (r.data.especialidade) setEspecialidade(r.data.especialidade);
    if (r.data.tema) setDoc((prev) => (prev ? { ...prev, tema: r.data.tema } : prev));
    setMeta(null); setSalvo(null); setRevisao(null); setCorrecao(null);
  }
  function abrirDoc(d: Doc) {
    setDoc(d); setSecoes([]); setEvidencias([]); setMeta(null); setSalvo(null); setError(null); setRevisao(null); setTextoEditado({}); setEditandoVersao(null);
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
    setError(null); setSalvo(null); setRevisao(null); setCorrecao(null); setGerando(true); setEditandoVersao(null);
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

  // Aplicar correções da IA: reancora as afirmações reprovadas (contra as evidências
  // buscadas) e recalcula a confiança.
  async function corrigirAgora() {
    if (!doc || secoes.length === 0) return;
    setError(null); setCorrigindo(true); setCorrecao(null); setSalvo(null);
    const antes = validacao?.confidence ?? 0;
    const r = await aplicarCorrecoes({ docId: doc.id, secoes, evidencias });
    if (r.ok) {
      setSecoes(r.data.secoes);
      const te: Record<string, string> = {};
      for (const s of r.data.secoes) te[s.secao] = renderSecaoTexto(s);
      setTextoEditado(te);
      setCorrecao({ corrigidas: r.data.corrigidas, total: r.data.total, antes, depois: r.data.validacao.confidence });
    } else setError(r.error);
    setCorrigindo(false);
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
      {/* Banner do MODO EDIÇÃO focado */}
      {editandoVersao != null && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/50 bg-accent/15 px-4 py-2.5 shadow-lg backdrop-blur">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
            <PencilLine className="h-4 w-4" /> Editando a Versão {editandoVersao} — altere as seções abaixo e salve como nova versão.
          </p>
          <button type="button" onClick={() => setEditandoVersao(null)} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/80 transition hover:text-white">
            <X className="h-3.5 w-3.5" /> Sair da edição
          </button>
        </div>
      )}

      {/* 1) TEMA / DOC */}
      <div className={card}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">1 · Tema da comparação</p>
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
                <label className={labelCls}>Abrir comparativo existente</label>
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
                <label className={labelCls}>Novo tema para comparar diretrizes</label>
                <input className={inputCls} value={novoTema} onChange={(e) => setNovoTema(e.target.value)} placeholder="Ex.: Anticoagulação na fibrilação atrial não valvar" />
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
          {/* 2) BUSCA + GERAÇÃO — escondida no modo edição focado (o Comparador não tem
              "fontes coladas"; reabrir uma versão só edita o texto/citações já buscados). */}
          {!editandoVersao && (
          <div className={card}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">2 · Buscar evidências e comparar</p>
            <p className="mb-3 text-[12px] text-white/50">Busca a <strong className="text-white/70">biblioteca interna</strong> (sempre) e o <strong className="text-white/70">PubMed</strong> sobre <em className="text-white/60">“{tema}”</em> e monta a tabela comparativa.</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={incluirPubmed} onChange={(e) => setIncluirPubmed(e.target.checked)} className="h-4 w-4 accent-[color:var(--accent)]" /> Incluir PubMed
              </label>
              <button type="button" onClick={gerarTudo} disabled={gerando || busy} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:brightness-75">
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />} Buscar e comparar
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
          )}

          {/* 3) RESULTADO */}
          {secoes.length > 0 && validacao && (
            <div ref={resultadoRef} className={card}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">3 · Comparação por aspecto (editável)</p>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${corConf}`}>{pct}% <span className="text-xs font-medium text-white/40">confiança</span></p>
                  <p className="text-[11px] text-white/40">
                    {validacao.validadas}/{validacao.totalClinicas} posições com citação validada
                    {validacao.conferidas > 0 && <span className="text-accent"> · +{validacao.conferidas} conferidas por você = {Math.round(((validacao.validadas + validacao.conferidas) / Math.max(1, validacao.totalClinicas)) * 100)}% resolvidas</span>}
                    {" · "}{validacao.semFonte} sem fonte · {validacao.invalidas} inválidas
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {secoes.map((sec) => {
                  const itens = validacao.itens.filter((it) => it.secao === sec.secao);
                  const problemas = itens.filter((it) => it.exigeFonte && it.status !== "valida" && !it.conferido);
                  const conferidasSec = itens.filter((it) => it.exigeFonte && it.status !== "valida" && it.conferido);
                  return (
                    <div key={sec.secao} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">{sec.secao}</p>
                        {problemas.length > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300"><AlertTriangle className="h-3 w-3" /> {problemas.length}</span>}
                        {conferidasSec.length > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"><CheckCircle2 className="h-3 w-3" /> {conferidasSec.length} conferida{conferidasSec.length > 1 ? "s" : ""} por você</span>}
                      </div>
                      <textarea className={inputCls + " min-h-[64px] resize-y font-mono text-[12px]"} value={textoEditado[sec.secao] ?? renderSecaoTexto(sec)} onChange={(e) => setTextoEditado((prev) => ({ ...prev, [sec.secao]: e.target.value }))} />
                      {problemas.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {problemas.map((p) => (
                            <li key={`${p.secaoIndex}:${p.afIndex}`} className="flex items-start gap-2 text-[11px] text-amber-300/80">
                              <span className="min-w-0 flex-1"><X className="mr-1 inline h-3 w-3" />{p.status === "sem_fonte" ? "sem fonte" : p.status === "fonte_inexistente" ? "source_id inexistente" : "âncora não consta na evidência"}: “{p.texto.slice(0, 60)}”</span>
                              <button type="button" onClick={() => aceitarAfirmacao(p.secaoIndex, p.afIndex, true)} title="Já conferi na fonte — resolver este aviso" className="shrink-0 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent transition hover:bg-accent/20"><CheckCircle2 className="h-3 w-3" /> Aceitar (conferido)</button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {conferidasSec.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {conferidasSec.map((p) => (
                            <li key={`${p.secaoIndex}:${p.afIndex}`} className="flex items-start gap-2 text-[11px] text-accent/75">
                              <span className="min-w-0 flex-1"><CheckCircle2 className="mr-1 inline h-3 w-3" />conferido por você: “{p.texto.slice(0, 60)}”</span>
                              <button type="button" onClick={() => aceitarAfirmacao(p.secaoIndex, p.afIndex, false)} className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/50 transition hover:text-white/80">desfazer</button>
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
                    <p className="mt-0.5 text-[11px] text-white/45">Confere que a posição atribuída a cada fonte é real (não trocou/inventou fonte) e que as divergências são fiéis.</p>
                  </div>
                  <button type="button" onClick={revisarAgora} disabled={revisando || gerando || busy} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50">
                    {revisando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {revisao ? "Revisar de novo" : "Revisar comparação"}
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

              {/* Aplicar correções da IA — reancora as afirmações reprovadas contra as
                  evidências buscadas e sobe a confiança */}
              {(() => {
                const reprovadas = validacao ? validacao.totalClinicas - validacao.validadas - validacao.conferidas : 0;
                return (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-white"><Wand2 className="h-4 w-4 text-accent" /> Aplicar correções da IA</p>
                        <p className="mt-0.5 text-[11px] text-white/45">A IA tenta reancorar as posições reprovadas num trecho verbatim das evidências buscadas (ou ajustar o texto pra bater, ou marcar honestamente como sem fonte). O código revalida e a confiança sobe conforme as evidências cobrem. Não salva — revise e salve depois.</p>
                      </div>
                      <button type="button" onClick={corrigirAgora} disabled={corrigindo || gerando || busy || reprovadas === 0} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        {corrigindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} {reprovadas === 0 ? "Nada a corrigir" : `Corrigir ${reprovadas} posição(ões)`}
                      </button>
                    </div>
                    {correcao && (
                      <p className="mt-3 border-t border-white/10 pt-3 text-[12px] text-white/70">
                        ✓ {correcao.corrigidas} de {correcao.total} reancorada(s). Confiança {Math.round(correcao.antes * 100)}% → <strong className="text-accent">{Math.round(correcao.depois * 100)}%</strong>.
                        {correcao.total - correcao.corrigidas > 0 && <span className="text-white/50"> As {correcao.total - correcao.corrigidas} restantes não têm respaldo literal nas evidências — busque novamente com outro tema/fontes, ou edite/remova.</span>}
                      </p>
                    )}
                  </div>
                );
              })()}

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
                  <div key={v.id} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] transition hover:border-accent/40 hover:bg-white/[0.04]">
                    <button type="button" onClick={() => abrirVersao(v.id, v.version_number, true)} disabled={gerando || busy}
                      className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm disabled:opacity-50">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span className="text-white/70">Versão {v.version_number}</span>
                      {v.is_published
                        ? <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent"><CheckPub className="h-3 w-3" /> pública (congelada)</span>
                        : <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/45">rascunho</span>}
                      <span className="ml-auto text-[10px] text-white/30">{dataCurta(v.created_at)}</span>
                      <span className="shrink-0 text-[10px] font-medium text-accent/80">abrir p/ editar →</span>
                    </button>
                    {!v.is_published && (
                      <button type="button" title="Excluir esta versão" onClick={() => excluirVersaoClick(v.id, v.version_number)} disabled={gerando || busy}
                        className="shrink-0 px-2.5 py-2 text-rose-400/60 transition hover:text-rose-400 disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
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
                  <a href={`/comparativos/${doc.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/75 transition hover:text-white"><Globe className="h-3.5 w-3.5" /> Ver no site</a>
                  <button type="button" onClick={despublicar} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-white/70 transition hover:text-white disabled:opacity-50"><EyeOff className="h-3.5 w-3.5" /> Despublicar</button>
                </>
              )}
              {statusAtual !== "archived" && (
                <button type="button" onClick={arquivar} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-white/50 transition hover:text-white/80 disabled:opacity-50"><Archive className="h-3.5 w-3.5" /> Arquivar</button>
              )}
              <button type="button" onClick={excluir} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/25 px-4 py-1.5 text-xs font-medium text-rose-300/80 transition hover:border-rose-400/50 hover:text-rose-300 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Excluir</button>
            </div>
            <p className="mt-2 text-[11px] text-white/35">Publicar congela a versão (imutável) e mostra o comparativo em /comparativos.</p>
          </div>
        </>
      )}

      {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>}
    </div>
  );
}
