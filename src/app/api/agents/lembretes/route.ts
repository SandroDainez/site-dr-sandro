import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { verificarCronSecret } from "@/lib/agents/utils";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";

export const maxDuration = 120;

// Envia o lembrete diário a quem tem questões pendentes de revisão E ativou as notificações.
export async function POST(request: NextRequest) {
  if (!verificarCronSecret(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!serviceConfigured() || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "VAPID/Supabase não configurados" }, { status: 503 });
  }
  webpush.setVapidDetails("mailto:contato@portal-medico.app", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const sb = createServiceClient();

  const hoje = new Date().toISOString().slice(0, 10);
  const { data: due } = await sb.from("srs_cards").select("user_id").lte("proxima_revisao", hoje);
  const pendentesPorUser = new Map<string, number>();
  for (const r of due ?? []) pendentesPorUser.set(r.user_id, (pendentesPorUser.get(r.user_id) ?? 0) + 1);

  const { data: subs } = await sb.from("push_subscriptions").select("endpoint,user_id,p256dh,auth");
  let enviados = 0, removidos = 0;
  for (const s of subs ?? []) {
    const n = pendentesPorUser.get(s.user_id) ?? 0;
    if (n === 0) continue;
    const payload = JSON.stringify({ titulo: "Revisão de hoje 🔥", corpo: `${n} ${n === 1 ? "questão" : "questões"} para revisar. Mantenha sua ofensiva!`, url: "/estudar" });
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      enviados++;
    } catch (e) {
      const statusCode = (e as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) { await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint); removidos++; }
    }
  }
  return NextResponse.json({ status: "ok", enviados, removidos, usuariosComPendencia: pendentesPorUser.size });
}

export async function GET(request: NextRequest) { return POST(request); }
