"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2, Sparkles, Pencil, X, Eye, EyeOff } from "lucide-react";
import { salvarQuestao, excluirQuestao, alternarAtivo, gerarQuestoesIA } from "./actions";

type Q = { id?: string; enunciado: string; opcoes: string[]; correta: number; explicacao?: string; area?: string; tema?: string; nivel?: string; ativo?: boolean };
const vazia: Q = { enunciado: "", opcoes: ["", "", "", ""], correta: 0, explicacao: "", area: "", tema: "", nivel: "", ativo: true };
const inputCls = "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/45";
const areaLabel: Record<string, string> = { anestesiologia: "Anestesiologia", terapia_intensiva: "Terapia Intensiva", emergencias: "Emergência" };

export default function BancoEditor({ inicial }: { inicial: Q[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Q>(vazia);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // gerador IA
  const [tema, setTema] = useState(""); const [areaIA, setAreaIA] = useState("anestesiologia"); const [qtd, setQtd] = useState(5);
  const [gerando, setGerando] = useState(false);
  const set = (k: keyof Q, v: any) => setForm((f) => ({ ...f, [k]: v }));

  function salvar() {
    setErr(null); setMsg(null);
    start(async () => {
      const r = await salvarQuestao(form);
      if (r.ok) { setMsg("Questão salva."); setForm(vazia); router.refresh(); } else setErr(r.error ?? "Erro.");
    });
  }
  function excluir(id: string) { start(async () => { await excluirQuestao(id); router.refresh(); }); }
  function toggle(id: string, ativo: boolean) { start(async () => { await alternarAtivo(id, ativo); router.refresh(); }); }
  function gerar() {
    setErr(null); setMsg(null); setGerando(true);
    gerarQuestoesIA(tema, areaIA, qtd).then((r) => {
      setGerando(false);
      if (r.ok) { setMsg(`${r.data?.criadas ?? 0} questões geradas como RASCUNHO — revise e ative abaixo.`); setTema(""); router.refresh(); }
      else setErr(r.error ?? "Falha ao gerar.");
    });
  }

  const rascunhos = inicial.filter((q) => q.ativo === false).length;

  return (
    <div className="space-y-6">
      {/* Gerador IA */}
      <div className="rounded-2xl border border-accent/20 bg-accent/[0.04] p-5">
        <div className="mb-3 flex items-center gap-2 text-accent"><Sparkles className="h-4 w-4" /><h3 className="text-sm font-semibold text-white">Gerar questões por IA (a partir do seu conteúdo)</h3></div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Tema (ex.: Sepse, Via aérea difícil)" className={inputCls} />
          <select value={areaIA} onChange={(e) => setAreaIA(e.target.value)} className={inputCls}><option value="anestesiologia">Anestesiologia</option><option value="terapia_intensiva">Terapia Intensiva</option><option value="emergencias">Emergência</option></select>
          <select value={qtd} onChange={(e) => setQtd(Number(e.target.value))} className={inputCls}>{[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n} questões</option>)}</select>
        </div>
        <button type="button" onClick={gerar} disabled={gerando || !tema.trim()} className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
          <Sparkles className={`h-4 w-4 ${gerando ? "animate-pulse" : ""}`} /> {gerando ? "Gerando…" : "Gerar com IA"}
        </button>
        <p className="mt-2 text-[11px] text-white/45">Entram como rascunho (inativas). Revise a correção e ative — assim nada vai aos alunos sem sua conferência.</p>
      </div>

      {/* Formulário manual */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{form.id ? "Editar questão" : "Nova questão"}</h3>
          {form.id && <button type="button" onClick={() => setForm(vazia)} className="text-xs text-white/50 hover:text-white"><X className="inline h-3.5 w-3.5" /> cancelar</button>}
        </div>
        <div><label className={labelCls}>Enunciado (pode ser caso clínico)</label><textarea value={form.enunciado} onChange={(e) => set("enunciado", e.target.value)} rows={3} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Alternativas — marque a correta</label>
          {form.opcoes.map((op, oi) => (
            <div key={oi} className="mb-2 flex items-center gap-2">
              <input type="radio" name="correta-form" checked={form.correta === oi} onChange={() => set("correta", oi)} className="h-4 w-4 accent-[var(--accent,#2ce6b8)]" />
              <input value={op} onChange={(e) => set("opcoes", form.opcoes.map((o, k) => (k === oi ? e.target.value : o)))} placeholder={`Alternativa ${String.fromCharCode(65 + oi)}`} className={`${inputCls} flex-1`} />
              {form.opcoes.length > 2 && <button type="button" onClick={() => set("opcoes", form.opcoes.filter((_, k) => k !== oi))} className="px-1 text-white/30 hover:text-red-400">✕</button>}
            </div>
          ))}
          <button type="button" onClick={() => set("opcoes", [...form.opcoes, ""])} className="text-xs font-medium text-accent/80 hover:text-accent">+ alternativa</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className={labelCls}>Área</label><select value={form.area} onChange={(e) => set("area", e.target.value)} className={inputCls}><option value="">—</option><option value="anestesiologia">Anestesiologia</option><option value="terapia_intensiva">Terapia Intensiva</option><option value="emergencias">Emergência</option></select></div>
          <div><label className={labelCls}>Tema</label><input value={form.tema} onChange={(e) => set("tema", e.target.value)} placeholder="Ex.: Sepse" className={inputCls} /></div>
          <div><label className={labelCls}>Nível</label><select value={form.nivel} onChange={(e) => set("nivel", e.target.value)} className={inputCls}><option value="">—</option><option value="basico">Básico</option><option value="intermediario">Intermediário</option><option value="avancado">Avançado</option></select></div>
        </div>
        <div><label className={labelCls}>Explicação (após responder)</label><textarea value={form.explicacao} onChange={(e) => set("explicacao", e.target.value)} rows={2} className={inputCls} /></div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={salvar} disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">{form.id ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {pending ? "Salvando…" : form.id ? "Salvar" : "Adicionar questão"}</button>
          {msg && <span className="text-sm text-accent">{msg}</span>}
          {err && <span className="text-sm text-red-400">{err}</span>}
        </div>
      </div>

      {/* Lista */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.12em] text-white/40">Questões ({inicial.length}){rascunhos > 0 && <span className="ml-2 text-amber-300">· {rascunhos} rascunho(s) a revisar</span>}</p>
        <div className="space-y-2">
          {inicial.map((q) => (
            <div key={q.id} className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${q.ativo === false ? "border-amber-400/30 bg-amber-400/[0.04]" : "border-white/10 bg-white/[0.02]"}`}>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white line-clamp-2">{q.enunciado}</p>
                <p className="mt-0.5 text-[11px] text-white/45">{q.area ? areaLabel[q.area] ?? q.area : "Geral"}{q.tema ? ` · ${q.tema}` : ""} · {q.opcoes.length} alt.{q.ativo === false ? " · RASCUNHO" : ""}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => q.id && toggle(q.id, q.ativo === false)} className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white" title={q.ativo === false ? "Ativar" : "Desativar"}>{q.ativo === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                <button type="button" onClick={() => setForm({ ...q, opcoes: [...q.opcoes] })} className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white" title="Editar"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => q.id && excluir(q.id)} className="rounded-lg p-1.5 text-white/40 transition hover:bg-red-400/10 hover:text-red-400" title="Excluir"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
