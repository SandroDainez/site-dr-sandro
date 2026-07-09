"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Plus, Trash2, Loader2, ListChecks, Save, AlertTriangle, FileText, X, ShieldCheck, Cpu, CheckCircle2, Circle, PencilLine, Wand2 } from "lucide-react";
import AreasEditora from "@/components/admin/AreasEditora";
import { ESPECIALIDADES_MODULO, TIPOS_FONTE, NIVEIS_QUESTAO, QUANTIDADES_QUESTAO, justificativaTexto, type QuestaoGerada } from "@/lib/editora/questao-estrutura";
import { dataCurta } from "@/lib/format-date";
import { validarSecoes } from "@/lib/ai/citations";
import { questoesToSecoes } from "@/lib/editora/questao-estrutura";
import type { Source, Issue } from "@/lib/ai/types";
import { criarDoc, listarSources, adicionarSource, removerSource, gerar, revisar, salvarVersao, listarVersoes, carregarVersao, excluirVersao, publicarDoc, despublicarDoc, arquivarDoc, excluirDoc, aplicarCorrecoes as aplicarCorrecoesIA } from "./actions";
import FontesInput from "@/components/admin/FontesInput";
import { CheckCircle2 as CheckPub, Globe, EyeOff, Archive } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "border-white/15 text-white/50" },
  scientific_review: { label: "Em revisão", cls: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  ready_to_publish: { label: "Pronto", cls: "border-inten/30 bg-inten/10 text-inten" },
  published: { label: "Publicado", cls: "border-accent/40 bg-accent/10 text-accent" },
  archived: { label: "Arquivado", cls: "border-white/10 text-white/40" },
};

type Doc = { id: string; title: string; slug: string; status: string; specialty: string };
type Meta = { provider: string; model: string; tokensIn: number; tokensOut: number; confidence: number; method: string };
type RevisaoUI = { issues: Issue[]; corrigido: QuestaoGerada[]; usage: { tokensIn: number; tokensOut: number }; provider: string; model: string };

const inputCls = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/40";
const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-5";

const SEV_CLS: Record<string, string> = {
  alta: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  media: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  baixa: "border-white/15 bg-white/[0.04] text-white/60",
};

export default function CriadorQuestoes({ docsIniciais, modo }: { docsIniciais: Doc[]; modo: "mock" | "real" }) {
  const [docs, setDocs] = useState<Doc[]>(docsIniciais);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [especialidade, setEspecialidade] = useState<string>(ESPECIALIDADES_MODULO[0]);
  const [nivel, setNivel] = useState<string>(NIVEIS_QUESTAO[1]);
  const [quantidade, setQuantidade] = useState<number>(QUANTIDADES_QUESTAO[1]);
  const [sources, setSources] = useState<Source[]>([]);


  const [questoes, setQuestoes] = useState<QuestaoGerada[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [gerando, setGerando] = useState(false);

  const [revisao, setRevisao] = useState<RevisaoUI | null>(null);
  const [revisando, setRevisando] = useState(false);

  // aplicar correções da IA (reancorar afirmações reprovadas da justificativa)
  const [corrigindo, setCorrigindo] = useState(false);
  const [correcao, setCorrecao] = useState<{ corrigidas: number; total: number; antes: number; depois: number } | null>(null);

  const [salvo, setSalvo] = useState<{ versionNumber: number; confidence: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const [editandoVersao, setEditandoVersao] = useState<number | null>(null); // modo edição focado

  const [statusAtual, setStatusAtual] = useState<string>("");
  const [versoes, setVersoes] = useState<{ id: string; version_number: number; is_published: boolean; created_at: string }[]>([]);

  const validacao = useMemo(() => (questoes.length ? validarSecoes(questoesToSecoes(questoes), sources) : null), [questoes, sources]);

  // Validação MANUAL: o médico marca uma afirmação da JUSTIFICATIVA como "conferi na fonte"
  // (resolve o aviso sem citação verbatim). Fica gravado na versão ao salvar; contado à
  // parte da confiança automática. qi = índice da questão, ji = índice na justificativa.
  function aceitarAfirmacao(qi: number, ji: number, valor: boolean) {
    setQuestoes((prev) => prev.map((q, i) => (i !== qi ? q : {
      ...q, justificativa: q.justificativa.map((a, j) => (j !== ji ? a : { ...a, conferido: valor })),
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
  async function carregarSources(id: string) { const r = await listarSources(id); if (r.ok) setSources(r.data); }
  async function carregarVersoes(id: string, autoAbrirUltima = false) {
    const r = await listarVersoes(id);
    if (r.ok) {
      setVersoes(r.data);
      // Ao abrir um conjunto, recarrega a versão mais recente no editor (SEM entrar no modo
      // edição focado).
      if (autoAbrirUltima && r.data.length > 0) abrirVersao(r.data[0].id, r.data[0].version_number, false);
    }
  }
  // Reabre o conteúdo de uma versão salva no editor (editar + salvar cria nova versão).
  // foco=true → entra no MODO EDIÇÃO focado (esconde referências/geração, mostra banner).
  const resultadoRef = useRef<HTMLDivElement>(null);
  async function abrirVersao(versionId: string, versionNumber?: number, foco = false) {
    setError(null);
    const r = await carregarVersao(versionId);
    if (!r.ok) { setError(r.error); return; }
    setEditandoVersao(foco ? (versionNumber ?? null) : null);
    setQuestoes(r.data.questoes); setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    if (r.data.especialidade) setEspecialidade(r.data.especialidade);
    if (r.data.nivel) setNivel(r.data.nivel);
    setMeta(null); setSalvo(null); setRevisao(null); setCorrecao(null);
  }
  function abrirDoc(d: Doc) {
    setDoc(d); setQuestoes([]); setMeta(null); setSalvo(null); setError(null); setRevisao(null); setEditandoVersao(null);
    setStatusAtual(d.status);
    carregarSources(d.id); carregarVersoes(d.id, true);
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
      const r = await criarDoc({ title: novoTitulo, especialidadeModulo: especialidade });
      if (r.ok) { setDocs((prev) => [r.data, ...prev]); setNovoTitulo(""); abrirDoc(r.data); } else setError(r.error);
    });
  }
  function delSource(id: string) {
    startTransition(async () => { const r = await removerSource(id); if (r.ok) setSources((prev) => prev.filter((s) => s.id !== id)); else setError(r.error); });
  }

  async function gerarTudo() {
    if (!doc) return;
    if (sources.length === 0) { setError("Adicione ao menos uma referência antes de gerar."); return; }
    setError(null); setSalvo(null); setRevisao(null); setCorrecao(null); setGerando(true); setEditandoVersao(null);
    const r = await gerar({ docId: doc.id, especialidade, nivel, quantidade });
    if (!r.ok) { setError(r.error); setGerando(false); return; }
    setQuestoes(r.data.questoes);
    setMeta({ provider: r.data.provider, model: r.data.model, tokensIn: r.data.usage.tokensIn, tokensOut: r.data.usage.tokensOut, confidence: r.data.validacao.confidence, method: r.data.validacao.method });
    setGerando(false);
  }

  // Aplicar correções da IA: reancora as afirmações da justificativa reprovadas e
  // recalcula a confiança.
  async function corrigirAgora() {
    if (!doc || questoes.length === 0) return;
    setError(null); setCorrigindo(true); setCorrecao(null); setSalvo(null);
    const antes = validacao?.confidence ?? 0;
    const r = await aplicarCorrecoesIA({ docId: doc.id, questoes });
    if (r.ok) {
      setQuestoes(r.data.questoes);
      setCorrecao({ corrigidas: r.data.corrigidas, total: r.data.total, antes, depois: r.data.validacao.confidence });
    } else setError(r.error);
    setCorrigindo(false);
  }

  async function revisarAgora() {
    if (!doc || questoes.length === 0) return;
    setError(null); setRevisando(true); setRevisao(null);
    const r = await revisar({ docId: doc.id, questoes });
    if (r.ok) setRevisao({ issues: r.data.issues, corrigido: r.data.corrigido, usage: r.data.usage, provider: r.data.provider, model: r.data.model });
    else setError(r.error);
    setRevisando(false);
  }
  function aplicarCorrecoes() {
    if (revisao?.corrigido?.length) { setQuestoes(revisao.corrigido); }
  }

  function salvar() {
    if (!doc || questoes.length === 0) return;
    setError(null);
    const geracaoMeta = meta ? { provider: meta.provider, model: meta.model, tokensIn: meta.tokensIn, tokensOut: meta.tokensOut, confidence: meta.confidence, method: meta.method } : undefined;
    const revisaoMeta = revisao ? { provider: revisao.provider, model: revisao.model, tokensIn: revisao.usage.tokensIn, tokensOut: revisao.usage.tokensOut, issues: revisao.issues, corrigido: revisao.corrigido } : undefined;
    startTransition(async () => {
      const r = await salvarVersao({ docId: doc.id, especialidade, nivel, questoes, geracao: geracaoMeta, revisao: revisaoMeta });
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
            <PencilLine className="h-4 w-4" /> Editando a Versão {editandoVersao} — altere as questões abaixo e salve como nova versão.
          </p>
          <button type="button" onClick={() => setEditandoVersao(null)} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/80 transition hover:text-white">
            <X className="h-3.5 w-3.5" /> Sair da edição
          </button>
        </div>
      )}

      {/* 1) CONJUNTO */}
      <div className={card}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">1 · Conjunto de questões</p>
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
                <label className={labelCls}>Abrir existente</label>
                <select className={inputCls} value="" onChange={(e) => { const d = docs.find((x) => x.id === e.target.value); if (d) abrirDoc(d); }}>
                  <option value="">Selecione…</option>
                  {docs.map((d) => <option key={d.id} value={d.id}>{d.title} ({d.status})</option>)}
                </select>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <div>
                <label className={labelCls}>Ou criar novo</label>
                <input className={inputCls} value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} placeholder="Título. Ex.: Sepse — questões de revisão" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={criarNovo} disabled={busy || novoTitulo.trim().length < 3} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50"><Plus className="h-4 w-4" /> Criar</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {doc && (
        <>
          {/* 2) REFERÊNCIAS + 3) GERAÇÃO — escondidos no modo edição focado */}
          {!editandoVersao && (<>
          <div className={card}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">2 · Referências ({sources.length})</p>
            {sources.length > 0 && (
              <div className="mb-4 space-y-2">
                {sources.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase text-white/50">{s.tipo}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-white/80">{s.titulo}{s.autor ? ` — ${s.autor}` : ""}{s.ano ? ` (${s.ano})` : ""}</span>
                    <span className="shrink-0 text-[10px] text-white/30">{s.texto.length} car.</span>
                    <button type="button" onClick={() => delSource(s.id)} className="shrink-0 text-rose-400/70 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <FontesInput tipos={TIPOS_FONTE} busy={busy} onAdd={async (f) => {
              if (!doc) return { ok: false, error: "Abra um item." };
              const r = await adicionarSource({ docId: doc.id, titulo: f.titulo, tipo: f.tipo, autor: f.autor, ano: f.ano, texto: f.texto });
              if (r.ok) setSources((prev) => [...prev, r.data]);
              return { ok: r.ok, error: r.ok ? undefined : r.error };
            }} />
          </div>

          {/* 3) GERAÇÃO */}
          <div className={card}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">3 · Geração</p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className={labelCls}>Especialidade</label>
                <select className={inputCls + " sm:w-44"} value={especialidade} onChange={(e) => setEspecialidade(e.target.value)}>{ESPECIALIDADES_MODULO.map((e) => <option key={e} value={e}>{e}</option>)}</select>
              </div>
              <div>
                <label className={labelCls}>Nível</label>
                <select className={inputCls + " sm:w-32"} value={nivel} onChange={(e) => setNivel(e.target.value)}>{NIVEIS_QUESTAO.map((n) => <option key={n} value={n}>{n}</option>)}</select>
              </div>
              <div>
                <label className={labelCls}>Nº</label>
                <select className={inputCls + " sm:w-24"} value={quantidade} onChange={(e) => setQuantidade(parseInt(e.target.value))}>{QUANTIDADES_QUESTAO.map((q) => <option key={q} value={q}>{q}</option>)}</select>
              </div>
              <button type="button" onClick={gerarTudo} disabled={gerando || busy || sources.length === 0} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:brightness-75">
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />} Gerar {quantidade} questões
              </button>
            </div>
            {meta && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/50">
                <span className="inline-flex items-center gap-1.5 font-medium text-white/70"><Cpu className="h-3.5 w-3.5 text-accent" /> Estágio 1 · Geração</span>
                <span>{genProvider}</span>
                <span>{questoes.length} questões</span>
                <span className="ml-auto">tokens: <strong className="text-white/70">{fmt(meta.tokensIn)}</strong> in · <strong className="text-white/70">{fmt(meta.tokensOut)}</strong> out</span>
              </div>
            )}
          </div>
          </>)}

          {/* 4) RESULTADO */}
          {questoes.length > 0 && validacao && (
            <div ref={resultadoRef} className={card}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">4 · Questões</p>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${corConf}`}>{pct}% <span className="text-xs font-medium text-white/40">citação automática</span></p>
                  <p className="text-[11px] text-white/40">
                    {validacao.validadas}/{validacao.totalClinicas} citadas pelo código
                    {validacao.conferidas > 0 && <span className="text-accent"> · +{validacao.conferidas} conferidas por você = {Math.round(((validacao.validadas + validacao.conferidas) / Math.max(1, validacao.totalClinicas)) * 100)}% resolvidas</span>}
                    {" · "}{validacao.semFonte + validacao.invalidas} pendentes
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {questoes.map((q, i) => {
                  const itens = validacao.itens.filter((it) => it.secaoIndex === i);
                  const problemas = itens.filter((it) => it.exigeFonte && it.status !== "valida" && !it.conferido);
                  const conferidasQuestao = itens.filter((it) => it.exigeFonte && it.status !== "valida" && it.conferido);
                  return (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="mb-2 flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">{i + 1}</span>
                        <p className="text-sm font-medium text-white">{q.enunciado}</p>
                        {problemas.length > 0 && <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300"><AlertTriangle className="h-3 w-3" /> {problemas.length}</span>}
                        {conferidasQuestao.length > 0 && <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"><CheckCircle2 className="h-3 w-3" /> {conferidasQuestao.length} conferida{conferidasQuestao.length > 1 ? "s" : ""}</span>}
                      </div>
                      <ul className="mb-2 space-y-1">
                        {q.opcoes.map((op, j) => (
                          <li key={j} className={`flex items-start gap-2 rounded-md px-2 py-1 text-[13px] ${j === q.correta ? "bg-accent/10 text-accent" : "text-white/70"}`}>
                            {j === q.correta ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/25" />}
                            <span><strong className="mr-1">{String.fromCharCode(65 + j)})</strong>{op}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                        <p className="mb-0.5 text-[10px] uppercase tracking-[0.1em] text-white/30">Justificativa</p>
                        <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-white/70">{justificativaTexto(q) || "—"}</p>
                      </div>
                      {problemas.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {problemas.map((p) => (
                            <li key={`${p.secaoIndex}:${p.afIndex}`} className="flex items-start gap-2 text-[11px] text-amber-300/80">
                              <span className="min-w-0 flex-1"><X className="mr-1 inline h-3 w-3" />{p.status === "sem_fonte" ? "sem fonte" : p.status === "fonte_inexistente" ? "source_id inexistente" : "âncora não consta na referência"} (questão {i + 1}): “{p.texto.slice(0, 60)}”</span>
                              <button type="button" onClick={() => aceitarAfirmacao(p.secaoIndex, p.afIndex, true)} title="Já conferi na referência — resolver este aviso" className="shrink-0 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent transition hover:bg-accent/20"><CheckCircle2 className="h-3 w-3" /> Aceitar (conferido)</button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {conferidasQuestao.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {conferidasQuestao.map((p) => (
                            <li key={`${p.secaoIndex}:${p.afIndex}`} className="flex items-start gap-2 text-[11px] text-accent/75">
                              <span className="min-w-0 flex-1"><CheckCircle2 className="mr-1 inline h-3 w-3" />conferido por você (questão {i + 1}): “{p.texto.slice(0, 60)}”</span>
                              <button type="button" onClick={() => aceitarAfirmacao(p.secaoIndex, p.afIndex, false)} className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/50 transition hover:text-white/80">desfazer</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ESTÁGIO 2 — REVISÃO */}
              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-white"><ShieldCheck className="h-4 w-4 text-accent" /> Estágio 2 · Revisão {modo === "real" ? "(GPT-4o)" : "(mock)"}</p>
                    <p className="mt-0.5 text-[11px] text-white/45">A revisão confere o GABARITO contra as referências, distratores plausíveis, citações reais e transcrição de doses. Aponta e sugere; você pode aplicar as correções.</p>
                  </div>
                  <button type="button" onClick={revisarAgora} disabled={revisando || gerando || busy} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50">
                    {revisando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {revisao ? "Revisar de novo" : "Revisar questões"}
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
                      <p className="inline-flex items-center gap-1.5 text-sm text-accent"><CheckPub className="h-4 w-4" /> Nenhum apontamento — o revisor não encontrou problemas.</p>
                    ) : (
                      <>
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
                        <button type="button" onClick={aplicarCorrecoes} className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20">
                          Aplicar versão corrigida do revisor
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Aplicar correções da IA — reancora as afirmações da justificativa reprovadas */}
              {(() => {
                const reprovadas = validacao ? validacao.totalClinicas - validacao.validadas - validacao.conferidas : 0;
                return (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-white"><Wand2 className="h-4 w-4 text-accent" /> Aplicar correções da IA</p>
                        <p className="mt-0.5 text-[11px] text-white/45">A IA tenta reancorar as afirmações da justificativa reprovadas num trecho verbatim da referência (ou ajustar o texto pra bater, ou marcar honestamente como sem fonte). O código revalida e a confiança sobe conforme as referências cobrem. Não salva — revise e salve depois.</p>
                      </div>
                      <button type="button" onClick={corrigirAgora} disabled={corrigindo || gerando || busy || reprovadas === 0} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        {corrigindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} {reprovadas === 0 ? "Nada a corrigir" : `Corrigir ${reprovadas} afirmação(ões)`}
                      </button>
                    </div>
                    {correcao && (
                      <p className="mt-3 border-t border-white/10 pt-3 text-[12px] text-white/70">
                        ✓ {correcao.corrigidas} de {correcao.total} reancorada(s). Confiança {Math.round(correcao.antes * 100)}% → <strong className="text-accent">{Math.round(correcao.depois * 100)}%</strong>.
                        {correcao.total - correcao.corrigidas > 0 && <span className="text-white/50"> As {correcao.total - correcao.corrigidas} restantes não têm respaldo literal nas referências — adicione referências que as cubram, ou edite/remova.</span>}
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

          {/* 5) PUBLICAÇÃO */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">5 · Publicação</p>
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
              <p className="mb-4 text-[11px] text-white/35">Clique numa versão para reabrir as questões no editor. Editar e salvar cria uma nova versão (as anteriores ficam no histórico).</p>
              </>
            )}

            <AreasEditora tabela="questao_docs" docId={doc.id} />

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={publicar} disabled={busy || versoes.length === 0} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50">
                <Globe className="h-3.5 w-3.5" /> Publicar (versão mais recente)
              </button>
              {statusAtual === "published" && (
                <>
                  <a href={`/questoes/${doc.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/75 transition hover:text-white"><Globe className="h-3.5 w-3.5" /> Ver no site</a>
                  <button type="button" onClick={despublicar} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-white/70 transition hover:text-white disabled:opacity-50"><EyeOff className="h-3.5 w-3.5" /> Despublicar</button>
                </>
              )}
              {statusAtual !== "archived" && (
                <button type="button" onClick={arquivar} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-white/50 transition hover:text-white/80 disabled:opacity-50"><Archive className="h-3.5 w-3.5" /> Arquivar</button>
              )}
              <button type="button" onClick={excluir} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/25 px-4 py-1.5 text-xs font-medium text-rose-300/80 transition hover:border-rose-400/50 hover:text-rose-300 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Excluir</button>
            </div>
            <p className="mt-2 text-[11px] text-white/35">Publicar congela a versão (imutável), mostra em /questoes e <strong className="text-white/50">alimenta o quiz</strong> (as questões entram no banco do /estudar). Despublicar/arquivar desativa essas questões no quiz.</p>
          </div>
        </>
      )}

      {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>}
    </div>
  );
}
