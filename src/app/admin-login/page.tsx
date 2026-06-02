"use client";

import { useActionState } from "react";
import { adminLogin } from "./actions";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [state, action, isPending] = useActionState(adminLogin, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07090f] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
            <Lock className="h-5 w-5 text-accent" />
          </div>
          <h1 className="text-xl font-semibold text-white">Admin · Dr. Sandro</h1>
          <p className="mt-1 text-sm text-muted">Entre com sua senha para acessar o painel.</p>
        </div>

        <form action={action} className="space-y-3">
          <input
            type="password"
            name="password"
            placeholder="Senha"
            required
            autoFocus
            className="w-full rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-accent/50"
          />

          {state?.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
