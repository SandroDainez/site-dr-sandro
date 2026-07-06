"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2, Loader2, Wand2, Save, CheckCircle2, Circle, AlertTriangle, FileText, X, RefreshCw, ShieldCheck, Cpu } from "lucide-react";
import { SCI_BLOCOS, ESPECIALIDADES_MODULO, TIPOS_FONTE } from "@/lib/editora/cientifico-estrutura";
import { dataCurta } from "@/lib/format-date";
import { validarSecoes } from "@/lib/ai/citations";
import type { Source, SecaoGerada, Issue } from "@/lib/ai/types";
import { criarDoc, listarSources, adicionarSource, removerSource, gerarBloco, revisar, salvarVersao, listarVersoes, publicarDoc, despublicarDoc, arquivarDoc } from "./actions";
import { CheckCircle2 as CheckPub, Globe, EyeOff, Archive } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "border-white/15 text-white/50" },
  scientific_review: { label: "Em revisão", cls: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  ready_to_publish: { label: "Pronto", cls: "border-inten/30 bg-inten/10 text-inten" },
  published: { label: "Publicado", cls: "border-accent/40 bg-accent/10 text-accent" },
  archived: { label: "Arquivado", cls: "border-white/10 text-white/40" },
};

type Doc = { id: string; title: string; slug: string; status: string; specialty: string };
type BlocoStatus = { status: "pendente" | "gerando" | "concluido" | "erro"; confidence?: number; err?: string };
type Meta = { blocoIndex: number; provider: string; model: string; tokensIn: number; tokensOut: number; secoes: SecaoGerada[]; confidence: number; method: string };
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
  return sec.afirmacoes
    .map((a) => (a.source_id ? `${a.texto} [${a.source_id}]` : `${a.texto}  ⚠ sem fonte`))
    .join("\n");
}

export default function EditorPremium({ docsIniciais, modo }: { docsIniciais: Doc[]; modo: "mock" | "real" }) {
  const [docs, setDocs] = useState<Doc[]>(docsIniciais);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [especialidade, setEspecialidade] = useState<string>(ESPECIALIDADES_MODULO[0]);
  const [sources, setSources] = useState<Source[]>([]);
  const [rascunho, setRascunho] = useState("");

  // form de referência
  const [sTitulo, setSTitulo] = useState(""); const [sTipo, setSTipo] = useState<string>(TIPOS_FONTE[0]);
  const [sAutor, setSAutor] = useState(""); const [sAno, setSAno] = useState(""); const [sTexto, setSTexto] = useState("");

  // refinamento
  const [blocos, setBlocos] = useState<BlocoStatus[]>(SCI_BLOCOS.map(() => ({ status: "pendente" })));
  const [secoes, setSecoes] = useState<SecaoGerada[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [gerando, setGerando] = useState(false);
  const [textoEditado, setTextoEditado] = useState<Record<string, string>>({});

  // revisão (estágio 2)
  const [revisao, setRevisao] = useState<RevisaoUI | null>(null);
  const [revisando, setRevisando] = useState(false);

  const [salvo, setSalvo] = useState<{ versionNumber: number; confidence: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  // publicação
  const [statusAtual, setStatusAtual] = useState<string>("");
  const [versoes, setVersoes] = useState<{ id: string; version_number: number; is_published: boolean; created_at: string }[]>([]);

  const validacao = useMemo(() => (secoes.length ? validarSecoes(secoes, sources) : null), [secoes, sources]);

  async function carregarSources(id: string) {
    const r = await listarSources(id);
    if (r.ok) setSources(r.data);
  }
  async function carregarVersoes(id: string) {
    const r = await listarVersoes(id);
    if (r.ok) setVersoes(r.data);
  }
  function abrirDoc(d: Doc) {
    setDoc(d); setSecoes([]); setMetas([]); setSalvo(null); setError(null); setRevisao(null); setRascunho("");
    setBlocos(SCI_BLOCOS.map(() => ({ status: "pendente" }))); setTextoEditado({});
    setStatusAtual(d.status);
    carregarSources(d.id); carregarVersoes(d.id);
  }
  function aplicarStatus(status: string) {
    setStatusAtual(status);
    setDoc((prev) => (prev ? { ...prev, status } : prev));
    setDocs((prev) => prev.map((d) => (doc && d.id === doc.id ? { ...d, status } : d)));
  }
  function publicar() {
    if (!doc) return; setError(null);
    startTransition(async () => { const r = await publicarDoc(doc.id); if (r.ok) { aplicarStatus(r.data.status); carregarVersoes(doc.id); } else setError(r.error); });
  }
  function despublicar() {
    if (!doc) return; setError(null);
    startTransition(async () => { const r = await despublicarDoc(doc.id); if (r.ok) { aplicarStatus(r.data.status); carregarVersoes(doc.id); } else setError(r.error); });
  }
  function arquivar() {
    if (!doc) return; setError(null);
    startTransition(async () => { const r = await arquivarDoc(doc.id); if (r.ok) { aplicarStatus(r.data.status); carregarVersoes(doc.id); } else setError(r.error); });
  }
  function criarNovo() {
    setError(null);
    startTransition(async () => {
      const r = await criarDoc({ title: novoTitulo, especialidadeModulo: especialidade });
      if (r.ok) { setDocs((prev) => [r.data, ...prev]); setNovoTitulo(""); abrirDoc(r.data); }
      else setError(r.error);
    });
  }
  function addSource() {
    if (!doc) return;
    setError(null);
    startTransition(async () => {
      const r = await adicionarSource({ docId: doc.id, titulo: sTitulo, tipo: sTipo, autor: sAutor || undefined, ano: sAno ? parseInt(sAno) : null, texto: sTexto });
      if (r.ok) { setSources((prev) => [...prev, r.data]); setSTitulo(""); setSAutor(""); setSAno(""); setSTexto(""); }
      else setError(r.error);
    });
  }
  function delSource(id: string) {
    startTransition(async () => {
      const r = await removerSource(id);
      if (r.ok) setSources((prev) => prev.filter((s) => s.id !== id));
      else setError(r.error);
    });
  }

  // Refinamento BLOCO A BLOCO a partir de `start` (0 = tudo; i = retry do bloco i em diante).
  async function gerarDoBloco(start: number) {
    if (!doc) return;
    if (sources.length === 0) { setError("Adicione ao menos uma referência antes de refinar."); return; }
    setError(null); setSalvo(null); setRevisao(null); setGerando(true);
    const metasLocal: Meta[] = start === 0 ? [] : metas.filter((m) => m.blocoIndex < start);
    let acumulado: SecaoGerada[] = metasLocal.flatMap((m) => m.secoes);
    setSecoes([...acumulado]); setMetas([...metasLocal]);
    setBlocos((prev) => prev.map((b, idx) => (idx >= start ? { status: "pendente" } : b)));
    for (let i = start; i < SCI_BLOCOS.length; i++) {
      setBlocos((prev) => prev.map((b, idx) => (idx === i ? { status: "gerando" } : b)));
      const r = await gerarBloco({ docId: doc.id, blocoIndex: i, especialidade, rascunho, secoesAnteriores: acumulado });
      if (!r.ok) {
        setBlocos((prev) => prev.map((b, idx) => (idx === i ? { status: "erro", err: r.error } : b)));
        setError(`Bloco ${i + 1}: ${r.error}`); setGerando(false); return;
      }
      acumulado = [...acumulado, ...r.data.secoes];
      metasLocal.push({ blocoIndex: i, provider: r.data.provider, model: r.data.model, tokensIn: r.data.usage.tokensIn, tokensOut: r.data.usage.tokensOut, secoes: r.data.secoes, confidence: r.data.validacaoBloco.confidence, method: r.data.validacaoBloco.method });
      setSecoes([...acumulado]); setMetas([...metasLocal]);
      setBlocos((prev) => prev.map((b, idx) => (idx === i ? { status: "concluido", confidence: r.data.validacaoBloco.confidence } : b)));
    }
    const te: Record<string, string> = {};
    for (const s of acumulado) te[s.secao] = renderSecaoTexto(s);
    setTextoEditado(te);
    setGerando(false);
  }
  const refinarTudo = () => gerarDoBloco(0);

  async function revisarAgora() {
    if (!doc || secoes.length === 0) return;
    setError(null); setRevisando(true); setRevisao(null);
    const r = await revisar({ docId: doc.id, secoes });
    if (r.ok) setRevisao({ issues: r.data.issues, corrigido: r.data.corrigido, usage: r.data.usage, provider: r.data.provider, model: r.data.model });
    else setError(r.error);
    setRevisando(false);
  }

  function salvar() {
    if (!doc || secoes.length === 0) return;
    setError(null);
    const revisaoMeta = revisao
      ? { provider: revisao.provider, model: revisao.model, tokensIn: revisao.usage.tokensIn, tokensOut: revisao.usage.tokensOut, issues: revisao.issues, corrigido: revisao.corrigido }
      : undefined;
    startTransition(async () => {
      const r = await salvarVersao({ docId: doc.id, especialidade, secoes, textoEditado, geracoes: metas, revisao: revisaoMeta });
      if (r.ok) { setSalvo({ versionNumber: r.data.versionNumber, confidence: r.data.validacao.confidence }); carregarVersoes(doc.id); }
      else setError(r.error);
    });
  }

  const pct = validacao ? Math.round(validacao.confidence * 100) : 0;
  const corConf = pct >= 90 ? "text-accent" : pct >= 70 ? "text-amber-300" : "text-rose-300";

  const genTokens = metas.reduce((a, m) => ({ in: a.in + m.tokensIn, out: a.out + m.tokensOut }), { in: 0, out: 0 });
  const genProvider = metas[0] ? `${metas[0].provider}/${metas[0].model}` : (modo === "real" ? "deepseek" : "mock");
  const fmt = (n: number) => n.toLocaleString("pt-BR");

  return (
    <div className="space-y-6">
      {/* 1) TEXTO */}
      <div className={card}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">1 · Texto (biblioteca científica)</p>
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
                <input className={inputCls} value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} placeholder="Título do texto a refinar" />
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
          {/* 2) REFERÊNCIAS */}
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
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
              <p className="text-[11px] text-white/40">Adicionar referência (texto colado). É contra este texto que as citações são verificadas.</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_150px_1fr_90px]">
                <input className={inputCls} value={sTitulo} onChange={(e) => setSTitulo(e.target.value)} placeholder="Título da referência" />
                <select className={inputCls} value={sTipo} onChange={(e) => setSTipo(e.target.value)}>{TIPOS_FONTE.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                <input className={inputCls} value={sAutor} onChange={(e) => setSAutor(e.target.value)} placeholder="Autor / sociedade" />
                <input className={inputCls} value={sAno} onChange={(e) => setSAno(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Ano" inputMode="numeric" />
              </div>
              <textarea className={inputCls + " min-h-[90px] resize-y"} value={sTexto} onChange={(e) => setSTexto(e.target.value)} placeholder="Cole aqui o texto do artigo/diretriz." />
              <button type="button" onClick={addSource} disabled={busy || sTexto.trim().length < 10} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/80 transition hover:border-accent/40 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Adicionar referência</button>
            </div>
          </div>

          {/* 3) RASCUNHO */}
          <div className={card}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">3 · Rascunho a refinar</p>
            <textarea className={inputCls + " min-h-[160px] resize-y"} value={rascunho} onChange={(e) => setRascunho(e.target.value)} placeholder="Cole o rascunho do texto que você quer densificar e melhorar. O Editor Premium reescreve com mais densidade e forma, mantendo cada afirmação ancorada nas referências (o que não tiver respaldo vira ⚠ sem fonte)." />
            <p className="mt-1 text-[11px] text-white/35">{rascunho.trim().length} caracteres. Vazio? O Premium compõe a partir apenas das referências.</p>
          </div>

          {/* 4) ÁREA + REFINAMENTO */}
          <div className={card}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">4 · Área · Refinamento</p>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div>
                <label className={labelCls}>Especialidade / tipo</label>
                <select className={inputCls + " sm:w-56"} value={especialidade} onChange={(e) => setEspecialidade(e.target.value)}>{ESPECIALIDADES_MODULO.map((e) => <option key={e} value={e}>{e}</option>)}</select>
              </div>
              <button type="button" onClick={refinarTudo} disabled={gerando || busy || sources.length === 0} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50">
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Refinar ({SCI_BLOCOS.length} blocos)
              </button>
            </div>

            {/* progresso bloco a bloco */}
            <div className="space-y-1.5">
              {SCI_BLOCOS.map((secoesDoBloco, i) => {
                const st = blocos[i];
                return (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
                    {st.status === "concluido" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                      : st.status === "gerando" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-300" />
                      : st.status === "erro" ? <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                      : <Circle className="h-4 w-4 shrink-0 text-white/25" />}
                    <span className="text-white/40">Bloco {i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-white/55">{secoesDoBloco.join(" · ")}</span>
                    {st.status === "concluido" && st.confidence !== undefined && <span className="shrink-0 text-[11px] text-white/40">conf. bloco {Math.round(st.confidence * 100)}%</span>}
                    {st.status === "gerando" && <span className="shrink-0 text-[11px] text-amber-300">refinando…</span>}
                    {st.status === "erro" && (
                      <button type="button" onClick={() => gerarDoBloco(i)} disabled={gerando} className="shrink-0 inline-flex items-center gap-1 rounded-full border border-rose-400/30 px-2.5 py-0.5 text-[11px] font-medium text-rose-300 transition hover:bg-rose-400/10 disabled:opacity-50">
                        <RefreshCw className="h-3 w-3" /> tentar de novo
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {metas.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/50">
                <span className="inline-flex items-center gap-1.5 font-medium text-white/70"><Cpu className="h-3.5 w-3.5 text-accent" /> Estágio 1 · Refinamento</span>
                <span>{genProvider}</span>
                <span>{metas.length}/{SCI_BLOCOS.length} blocos</span>
                <span className="ml-auto">tokens: <strong className="text-white/70">{fmt(genTokens.in)}</strong> in · <strong className="text-white/70">{fmt(genTokens.out)}</strong> out</span>
              </div>
            )}
          </div>

          {/* 5) RESULTADO */}
          {secoes.length > 0 && validacao && (
            <div className={card}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">5 · Resultado (editável)</p>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${corConf}`}>{pct}% <span className="text-xs font-medium text-white/40">confiança</span></p>
                  <p className="text-[11px] text-white/40">{validacao.validadas}/{validacao.totalClinicas} afirmações que exigem fonte com citação validada · {validacao.semFonte} sem fonte · {validacao.invalidas} inválidas</p>
                </div>
              </div>
              <details className="mb-4 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[11px] text-white/50">
                <summary className="cursor-pointer text-white/60">Como a confiança é calculada (método)</summary>
                <p className="mt-2 leading-relaxed">{validacao.method}</p>
              </details>

              <div className="space-y-3">
                {secoes.map((sec) => {
                  const itens = validacao.itens.filter((it) => it.secao === sec.secao);
                  const problemas = itens.filter((it) => it.exigeFonte && it.status !== "valida");
                  return (
                    <div key={sec.secao} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="mb-1.5 flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{sec.secao}</p>
                        {problemas.length > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300"><AlertTriangle className="h-3 w-3" /> {problemas.length} sem citação válida</span>}
                      </div>
                      <textarea className={inputCls + " min-h-[70px] resize-y font-mono text-[12px]"} value={textoEditado[sec.secao] ?? renderSecaoTexto(sec)} onChange={(e) => setTextoEditado((prev) => ({ ...prev, [sec.secao]: e.target.value }))} />
                      {problemas.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {problemas.map((p, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-[11px] text-amber-300/80">
                              <X className="h-3 w-3 shrink-0" /> {p.status === "sem_fonte" ? "sem fonte" : p.status === "fonte_inexistente" ? "source_id inexistente" : "âncora não consta na referência"}: “{p.texto.slice(0, 60)}”
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
                    <p className="mt-0.5 text-[11px] text-white/45">Um segundo modelo audita o texto refinado: consistência, citações apontando para referências reais, dados transcritos fielmente e extrapolações. Não reescreve sozinho — aponta e sugere.</p>
                  </div>
                  <button type="button" onClick={revisarAgora} disabled={revisando || gerando || busy} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50">
                    {revisando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {revisao ? "Revisar de novo" : "Revisar texto"}
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
                    <p className="text-[11px] text-white/35">Os apontamentos e a versão corrigida ficam registrados em <code className="text-white/50">ai_generations</code> ao salvar. O índice de confiança acima continua sendo calculado pelo código.</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-4 mt-5 flex items-center gap-3">
                <button type="button" onClick={salvar} disabled={busy || gerando} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent shadow-lg transition hover:brightness-110 disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar como nova versão
                </button>
                {revisao && <span className="text-[11px] text-white/45">revisão incluída no registro</span>}
                {salvo && <span className="text-sm font-medium text-accent">✓ Versão {salvo.versionNumber} salva (confiança {Math.round(salvo.confidence * 100)}%)</span>}
              </div>
            </div>
          )}

          {/* 6) PUBLICAÇÃO */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">6 · Publicação</p>
              {(() => { const s = STATUS_LABEL[statusAtual] ?? STATUS_LABEL.draft; return <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.cls}`}>{s.label}</span>; })()}
            </div>

            {versoes.length === 0 ? (
              <p className="text-sm text-white/40">Salve uma versão para poder publicar.</p>
            ) : (
              <div className="mb-4 space-y-1.5">
                {versoes.map((v) => (
                  <div key={v.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
                    <span className="text-white/70">Versão {v.version_number}</span>
                    {v.is_published
                      ? <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent"><CheckPub className="h-3 w-3" /> pública (congelada)</span>
                      : <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/45">rascunho</span>}
                    <span className="ml-auto text-[10px] text-white/30">{dataCurta(v.created_at)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={publicar} disabled={busy || versoes.length === 0} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50">
                <Globe className="h-3.5 w-3.5" /> Publicar (versão mais recente)
              </button>
              {statusAtual === "published" && (
                <>
                  <a href={`/biblioteca-cientifica/${doc.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/75 transition hover:text-white"><Globe className="h-3.5 w-3.5" /> Ver no site</a>
                  <button type="button" onClick={despublicar} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-white/70 transition hover:text-white disabled:opacity-50"><EyeOff className="h-3.5 w-3.5" /> Despublicar</button>
                </>
              )}
              {statusAtual !== "archived" && (
                <button type="button" onClick={arquivar} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-white/50 transition hover:text-white/80 disabled:opacity-50"><Archive className="h-3.5 w-3.5" /> Arquivar</button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-white/35">Publicar congela a versão mais recente (imutável) e a torna pública em /biblioteca-cientifica. Editar depois cria um novo rascunho; a versão pública só muda quando você republicar.</p>
          </div>
        </>
      )}

      {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>}
    </div>
  );
}
