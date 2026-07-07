"use server";

import { cookies } from "next/headers";
import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || token !== createHash("sha256").update(pw).digest("hex")) {
    throw new Error("Não autorizado");
  }
}

type Result = { ok: boolean; data?: unknown; error?: string };

// Dispara um agente em processo (sem brecha pública): injeta o CRON_SECRET aqui,
// no servidor, depois de checar que quem chamou é o admin logado.
export async function runAgent(which: "updates" | "events"): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured() || !process.env.OPENAI_API_KEY) {
      return { ok: false, error: "Configure SUPABASE_SERVICE_ROLE_KEY e OPENAI_API_KEY primeiro (Fase E)." };
    }
    const req = new NextRequest(new URL(`https://internal/api/agents/${which}`), {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const mod = which === "updates"
      ? await import("@/app/api/agents/updates/route")
      : await import("@/app/api/agents/events/route");
    const res = await mod.POST(req);
    return { ok: res.ok, data: await res.json() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function toggleEvento(id: string, ativo: boolean): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase service role não configurado." };
    const supabase = createServiceClient();
    const { error } = await supabase.from("medical_events").update({ ativo }).eq("id", id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteEvento(id: string): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase service role não configurado." };
    const supabase = createServiceClient();
    const { error } = await supabase.from("medical_events").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function addEvento(ev: {
  titulo: string;
  especialidades: string[];
  data_inicio: string;
  data_fim?: string;
  local_nome?: string;
  cidade?: string;
  pais?: string;
  modalidade?: string;
  url_oficial: string;
  organizador?: string;
  selo?: string; // "proprio" | "parceiro" | "" — evento próprio/parceiro entra em destaque
}): Promise<Result> {
  try {
    await requireAdmin();
    if (!serviceConfigured()) return { ok: false, error: "Supabase service role não configurado." };
    if (!ev.titulo || !ev.data_inicio || !ev.url_oficial || !ev.especialidades?.length) {
      return { ok: false, error: "Preencha título, especialidade, data e URL oficial." };
    }
    const selo = ev.selo === "proprio" || ev.selo === "parceiro" ? ev.selo : null;
    const supabase = createServiceClient();
    const { error } = await supabase.from("medical_events").insert({
      titulo: ev.titulo,
      especialidades: ev.especialidades,
      data_inicio: ev.data_inicio,
      data_fim: ev.data_fim || null,
      local_nome: ev.local_nome || null,
      cidade: ev.cidade || null,
      pais: ev.pais || "Brasil",
      modalidade: ev.modalidade || "presencial",
      url_oficial: ev.url_oficial,
      organizador: ev.organizador || null,
      ativo: true,
      selo,
      destaque: !!selo, // próprio/parceiro → destaque
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
