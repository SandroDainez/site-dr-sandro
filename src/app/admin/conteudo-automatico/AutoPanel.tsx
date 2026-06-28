"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, Trash2, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { runAgent, toggleEvento, deleteEvento, addEvento } from "./actions";

const inputCls = "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/40";

const AREAS = [
  { value: "anestesiologia", label: "🩺 Anestesiologia" },
  { value: "terapia_intensiva", label: "🏥 Terapia Intensiva" },
  { value: "emergencias", label: "🚑 Emergências" },
];

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

type Props = {
  config: { supabase: boolean; openai: boolean; service: boolean };
  status: Record<string, any>;
  labels: Record<string, string>;
  especialidades: string[];
  eventos: any[];
};

export default function AutoPanel({ config, status, labels, especialidades, eventos }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // formulário de evento manual
  const [form, setForm] = useState({
    titulo: "", especialidades: [] as string[], data_inicio: "", data_fim: "",
    local_nome: "", cidade: "", pais: "Brasil", modalidade: "presencial", url_oficial: "", organizador: "", selo: "",
  });

  const pronto = config.supabase && config.openai && config.service;

  async function executar(which: "updates" | "events") {
    setRunning(which); setMsg(null); setErr(null);
    const r = await runAgent(which);
    setRunning(null);
    if (r.ok) { setMsg(`Agente "${which}" executado. ${JSON.stringify(r.data).slice(0, 300)}`); router.refresh(); }
    else setErr(r.error ?? "Falha ao executar.");
  }

  function toggleArea(v: string) {
    setForm((f) => ({ ...f, especialidades: f.especialidades.includes(v) ? f.especialidades.filter((x) => x !== v) : [...f.especialidades, v] }));
  }

  function salvarEvento() {
    setErr(null); setMsg(null);
    startTransition(async () => {
      const r = await addEvento(form);
      if (r.ok) { setMsg("Evento adicionado."); setForm({ titulo: "", especialidades: [], data_inicio: "", data_fim: "", local_nome: "", cidade: "", pais: "Brasil", modalidade: "presencial", url_oficial: "", organizador: "", selo: "" }); router.refresh(); }
      else setErr(r.error ?? "Falha ao adicionar.");
    });
  }

  return (
    <div className="space-y-6">
      {/* Estado da configuração */}
      {!pronto && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-sm text-white/75">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div>
            <p className="font-medium text-white">Faltam chaves para ativar os agentes:</p>
            <ul className="mt-1 space-y-0.5 text-white/60">
              <li>{config.supabase ? "✅" : "⬜"} Supabase (URL + anon)</li>
              <li>{config.service ? "✅" : "⬜"} Supabase service role (escrita)</li>
              <li>{config.openai ? "✅" : "⬜"} OpenAI API key</li>
            </ul>
            <p className="mt-1.5 text-white/50">O site continua normal; o conteúdo automático aparece quando os agentes rodarem.</p>
          </div>
        </div>
      )}

      {/* Botões executar agora */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={!pronto || running !== null}
          onClick={() => executar("updates")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-4 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-40"
        >
          {running === "updates" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running === "updates" ? "Coletando fontes… (1-2 min)" : "Executar atualizações agora"}
        </button>
        <button
          type="button"
          disabled={!pronto || running !== null}
          onClick={() => executar("events")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-blue-400/40 bg-blue-400/10 px-4 py-4 text-sm font-semibold text-blue-300 transition hover:bg-blue-400/20 disabled:opacity-40"
        >
          {running === "events" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running === "events" ? "Buscando eventos…" : "Executar eventos agora"}
        </button>
      </div>

      {msg && <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent">{msg}</p>}
      {err && <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-300">{err}</p>}

      {/* Status por especialidade */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-white/50">Última atualização por área</h2>
          <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-1 text-xs text-white/40 transition hover:text-white"><RefreshCw className="h-3.5 w-3.5" /> Atualizar</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {especialidades.map((esp) => {
            const s = status[esp];
            return (
              <div key={esp} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">{labels[esp]}</p>
                {s ? (
                  <div className="mt-1 space-y-0.5 text-xs text-white/55">
                    <p>Semana {s.semana} · {fmt(s.data)}</p>
                    <p>{s.topicos} tópicos · {s.fontes} fontes</p>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-white/35">Nenhuma ainda.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Eventos científicos */}
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.1em] text-white/50">Eventos científicos ({eventos.length})</h2>
        {eventos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/40">Nenhum evento ainda. Rode o agente de eventos ou adicione manualmente abaixo.</p>
        ) : (
          <div className="space-y-2">
            {eventos.map((ev) => (
              <div key={ev.id} className={`flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 ${ev.ativo ? "border-white/10 bg-white/[0.03]" : "border-white/5 bg-white/[0.01] opacity-50"}`}>
                <div className="min-w-0 flex-1">
                  <a href={ev.url_oficial} target="_blank" rel="noreferrer" className="text-sm font-medium text-white hover:text-accent">{ev.titulo}</a>
                  <p className="text-xs text-white/45">{fmt(ev.data_inicio)} · {ev.cidade || ev.local_nome || ""} · {ev.pais} · {ev.organizador || ""}</p>
                </div>
                <button type="button" onClick={() => startTransition(async () => { await toggleEvento(ev.id, !ev.ativo); router.refresh(); })} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 transition hover:border-white/30">
                  {ev.ativo ? "Desativar" : "Ativar"}
                </button>
                <button type="button" onClick={() => startTransition(async () => { await deleteEvento(ev.id); router.refresh(); })} className="rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-400/20"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adicionar evento manual */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Adicionar evento manualmente</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Título *</label>
            <input className={inputCls} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Congresso Brasileiro de Anestesiologia 2026" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Especialidades *</label>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <button key={a.value} type="button" onClick={() => toggleArea(a.value)} className={`rounded-full border px-3 py-1.5 text-xs transition ${form.especialidades.includes(a.value) ? "border-accent/50 bg-accent/15 text-accent" : "border-white/15 bg-white/[0.03] text-white/60"}`}>{a.label}</button>
              ))}
            </div>
          </div>
          <div><label className={labelCls}>Data início *</label><input type="date" className={inputCls} value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
          <div><label className={labelCls}>Data fim</label><input type="date" className={inputCls} value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} /></div>
          <div><label className={labelCls}>Cidade</label><input className={inputCls} value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
          <div><label className={labelCls}>País</label><input className={inputCls} value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} /></div>
          <div>
            <label className={labelCls}>Modalidade</label>
            <select className={inputCls} value={form.modalidade} onChange={(e) => setForm({ ...form, modalidade: e.target.value })}>
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>
          <div><label className={labelCls}>Organizador / Parceiro</label><input className={inputCls} value={form.organizador} onChange={(e) => setForm({ ...form, organizador: e.target.value })} placeholder="SBA, ou nome do parceiro" /></div>
          <div className="sm:col-span-2"><label className={labelCls}>URL oficial *</label><input className={inputCls} value={form.url_oficial} onChange={(e) => setForm({ ...form, url_oficial: e.target.value })} placeholder="https://..." /></div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Destaque (evento próprio ou de parceiro)</label>
            <select className={inputCls} value={form.selo} onChange={(e) => setForm({ ...form, selo: e.target.value })}>
              <option value="">Sem destaque (congresso comum)</option>
              <option value="proprio">★ Evento próprio (meu / da minha equipe)</option>
              <option value="parceiro">★ Evento de parceiro</option>
            </select>
            <p className="mt-1 text-[11px] text-white/40">Eventos próprios ou de parceiros aparecem destacados, em cor diferente e com selo explícito no calendário das 3 áreas.</p>
          </div>
        </div>
        <button type="button" disabled={pending} onClick={salvarEvento} className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50">
          <Plus className="h-4 w-4" /> {pending ? "Salvando…" : "Adicionar evento"}
        </button>
      </div>
    </div>
  );
}
