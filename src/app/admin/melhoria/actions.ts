"use server";

import { cookies } from "next/headers";
import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { serviceConfigured } from "@/lib/supabase/server";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || token !== createHash("sha256").update(pw).digest("hex")) throw new Error("Não autorizado");
}

type Result = { ok: boolean; data?: any; error?: string };

// Roda o agente de melhoria sob demanda (injeta o CRON_SECRET no servidor após
// confirmar o admin logado — mesma técnica do "executar agora" dos outros agentes).
export async function gerarMelhoria(): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured() || !process.env.OPENAI_API_KEY) {
      return { ok: false, error: "Configure SUPABASE_SERVICE_ROLE_KEY e OPENAI_API_KEY." };
    }
    const req = new NextRequest(new URL("https://internal/api/agents/melhoria"), {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const mod = await import("@/app/api/agents/melhoria/route");
    const res = await mod.POST(req);
    return { ok: res.ok, data: await res.json() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
