"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { entrarComSenha, cadastrar, enviarLinkMagico } from "./actions";

type Modo = "entrar" | "criar" | "magico";
const inputCls = "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/45";

// Campo de senha com o "olhinho" pra mostrar/ocultar.
function SenhaInput({ autoComplete, placeholder }: { autoComplete: string; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name="senha"
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required
        className={`${inputCls} pr-10`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        title={show ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function EntrarForm() {
  const [modo, setModo] = useState<Modo>("entrar");
  const [stEntrar, aEntrar, pEntrar] = useActionState(entrarComSenha, { ok: false });
  const [stCriar, aCriar, pCriar] = useActionState(cadastrar, { ok: false });
  const [stMagico, aMagico, pMagico] = useActionState(enviarLinkMagico, { ok: false });

  const tabs: { v: Modo; label: string }[] = [
    { v: "entrar", label: "Entrar" },
    { v: "criar", label: "Criar conta" },
    { v: "magico", label: "Link mágico" },
  ];

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
        {tabs.map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => setModo(t.v)}
            className={`flex-1 rounded-full px-3 py-1.5 text-[13px] font-medium transition ${modo === t.v ? "bg-accent text-[#07090f]" : "text-white/60 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {modo === "entrar" && (
        <form action={aEntrar} className="space-y-4">
          <div><label className={labelCls}>E-mail</label><input name="email" type="email" autoComplete="email" required className={inputCls} placeholder="voce@exemplo.com" /></div>
          <div><label className={labelCls}>Senha</label><SenhaInput autoComplete="current-password" placeholder="••••••••" /></div>
          {stEntrar.error && <p className="text-sm text-red-400">{stEntrar.error}</p>}
          <button disabled={pEntrar} className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50">{pEntrar ? "Entrando…" : "Entrar"}</button>
        </form>
      )}

      {modo === "criar" && (
        <form action={aCriar} className="space-y-4">
          <div><label className={labelCls}>Nome</label><input name="nome" type="text" className={inputCls} placeholder="Dr(a). Seu Nome" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Especialidade</label>
              <select name="especialidade" className={inputCls}>
                <option value="">—</option>
                <option value="anestesiologia">Anestesiologia</option>
                <option value="terapia_intensiva">Terapia Intensiva</option>
                <option value="emergencias">Emergência</option>
                <option value="outra">Outra</option>
              </select>
            </div>
            <div><label className={labelCls}>CRM (opcional)</label><input name="crm" type="text" className={inputCls} placeholder="CRM/UF 00000" /></div>
          </div>
          <div><label className={labelCls}>E-mail</label><input name="email" type="email" autoComplete="email" required className={inputCls} placeholder="voce@exemplo.com" /></div>
          <div><label className={labelCls}>Senha</label><SenhaInput autoComplete="new-password" placeholder="mínimo 6 caracteres" /></div>
          {stCriar.error && <p className="text-sm text-red-400">{stCriar.error}</p>}
          {stCriar.msg && <p className="text-sm text-accent">{stCriar.msg}</p>}
          <button disabled={pCriar} className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50">{pCriar ? "Criando…" : "Criar conta"}</button>
        </form>
      )}

      {modo === "magico" && (
        <form action={aMagico} className="space-y-4">
          <p className="text-sm text-white/55">Receba um link de acesso no seu e-mail — sem senha.</p>
          <div><label className={labelCls}>E-mail</label><input name="email" type="email" autoComplete="email" required className={inputCls} placeholder="voce@exemplo.com" /></div>
          {stMagico.error && <p className="text-sm text-red-400">{stMagico.error}</p>}
          {stMagico.msg && <p className="text-sm text-accent">{stMagico.msg}</p>}
          <button disabled={pMagico} className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50">{pMagico ? "Enviando…" : "Enviar link de acesso"}</button>
        </form>
      )}
    </div>
  );
}
