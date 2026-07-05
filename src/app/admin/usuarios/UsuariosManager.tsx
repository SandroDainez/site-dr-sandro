"use client";

import { useState, useTransition } from "react";
import { Check, Lock, Trash2, UserPlus, Loader2, ShieldCheck, Clock } from "lucide-react";
import { setLiberado, excluirUsuario, cadastrarUsuario, type UsuarioAdmin } from "./actions";

function fmt(iso: string): string {
  try { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); } catch { return ""; }
}

export default function UsuariosManager({ initial }: { initial: UsuarioAdmin[] }) {
  const [users, setUsers] = useState<UsuarioAdmin[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [novo, setNovo] = useState({ email: "", senha: "", nome: "", especialidade: "", crm: "" });
  const [pending, startTransition] = useTransition();

  function toggle(u: UsuarioAdmin) {
    setErro(null); setBusy(u.id);
    startTransition(async () => {
      const r = await setLiberado(u.id, !u.liberado);
      if (r.ok) setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, liberado: !x.liberado } : x)));
      else setErro(r.error);
      setBusy(null);
    });
  }

  function remover(u: UsuarioAdmin) {
    if (!confirm(`Excluir definitivamente o usuário ${u.email}? Essa ação não pode ser desfeita.`)) return;
    setErro(null); setBusy(u.id);
    startTransition(async () => {
      const r = await excluirUsuario(u.id);
      if (r.ok) setUsers((list) => list.filter((x) => x.id !== u.id));
      else setErro(r.error);
      setBusy(null);
    });
  }

  function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setBusy("novo");
    startTransition(async () => {
      const r = await cadastrarUsuario(novo);
      if (r.ok) {
        setNovo({ email: "", senha: "", nome: "", especialidade: "", crm: "" });
        setUsers((list) => [{ id: "novo-" + Date.now(), email: novo.email, nome: novo.nome, especialidade: novo.especialidade, crm: novo.crm, liberado: true, confirmado: true, criado_em: new Date().toISOString() }, ...list]);
      } else setErro(r.error);
      setBusy(null);
    });
  }

  const filtrados = users.filter((u) => `${u.email} ${u.nome}`.toLowerCase().includes(busca.toLowerCase()));
  const pendentes = users.filter((u) => !u.liberado).length;
  const input = "rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50";

  return (
    <div className="space-y-5">
      {erro && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">{erro}</p>}

      {/* Cadastrar usuário */}
      <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-white">+ Cadastrar usuário manualmente</summary>
        <form onSubmit={criar} className="mt-3 grid gap-2 sm:grid-cols-2">
          <input className={input} type="email" placeholder="E-mail *" required value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
          <input className={input} type="text" placeholder="Senha (mín. 6) *" required value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} />
          <input className={input} type="text" placeholder="Nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          <input className={input} type="text" placeholder="Especialidade" value={novo.especialidade} onChange={(e) => setNovo({ ...novo, especialidade: e.target.value })} />
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={pending && busy === "novo"} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
              {pending && busy === "novo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />} Cadastrar (já liberado)
            </button>
            <span className="text-[11px] text-white/40">O usuário criado aqui já entra confirmado e liberado.</span>
          </div>
        </form>
      </details>

      {/* Busca + resumo */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input className={`${input} w-64 max-w-full`} placeholder="Buscar por e-mail ou nome…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <span className="text-xs text-white/50">{users.length} usuário(s) · <span className="text-amber-300">{pendentes} pendente(s)</span></span>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtrados.length === 0 && <p className="text-sm text-white/40">Nenhum usuário.</p>}
        {filtrados.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{u.nome || u.email}</p>
              <p className="truncate text-xs text-white/45">{u.email}{u.especialidade ? ` · ${u.especialidade}` : ""} · {fmt(u.criado_em)}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {u.liberado ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent"><ShieldCheck className="h-3 w-3" /> Liberado</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300"><Clock className="h-3 w-3" /> Pendente</span>
                )}
                {!u.confirmado && <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">E-mail não confirmado</span>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {u.liberado ? (
                <button type="button" onClick={() => toggle(u)} disabled={busy === u.id} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-amber-400/40 hover:text-amber-300 disabled:opacity-50">
                  {busy === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />} Bloquear
                </button>
              ) : (
                <button type="button" onClick={() => toggle(u)} disabled={busy === u.id} className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">
                  {busy === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Liberar
                </button>
              )}
              <button type="button" onClick={() => remover(u)} disabled={busy === u.id} className="inline-flex items-center justify-center rounded-full border border-white/15 p-1.5 text-red-300/70 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-50" title="Excluir usuário">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
