"use client";

import { useActionState } from "react";
import { salvarPerfil } from "./actions";

const inputCls = "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/45";

export default function PerfilForm({ perfil }: { perfil: { nome?: string; especialidade?: string; crm?: string } }) {
  const [st, action, pending] = useActionState(salvarPerfil, { ok: false });
  return (
    <form action={action} className="space-y-4">
      <div><label className={labelCls}>Nome</label><input name="nome" defaultValue={perfil.nome ?? ""} className={inputCls} placeholder="Dr(a). Seu Nome" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Especialidade</label>
          <select name="especialidade" defaultValue={perfil.especialidade ?? ""} className={inputCls}>
            <option value="">—</option>
            <option value="anestesiologia">Anestesiologia</option>
            <option value="terapia_intensiva">Terapia Intensiva</option>
            <option value="emergencias">Emergência</option>
            <option value="outra">Outra</option>
          </select>
        </div>
        <div><label className={labelCls}>CRM</label><input name="crm" defaultValue={perfil.crm ?? ""} className={inputCls} placeholder="CRM/UF 00000" /></div>
      </div>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50">{pending ? "Salvando…" : "Salvar perfil"}</button>
        {st.ok && st.msg && <span className="text-sm text-accent">✓ {st.msg}</span>}
        {st.error && <span className="text-sm text-red-400">{st.error}</span>}
      </div>
    </form>
  );
}
