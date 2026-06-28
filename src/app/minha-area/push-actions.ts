"use server";

import { createAuthClient, getUsuario } from "@/lib/supabase/auth-server";

// Salva a inscrição de notificação do dispositivo do usuário.
export async function salvarInscricao(sub: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<{ ok: boolean }> {
  const user = await getUsuario();
  if (!user || !sub?.endpoint) return { ok: false };
  const supabase = await createAuthClient();
  const { error } = await supabase.from("push_subscriptions").upsert({
    endpoint: sub.endpoint, user_id: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth,
  });
  return { ok: !error };
}

export async function removerInscricao(endpoint: string): Promise<{ ok: boolean }> {
  const user = await getUsuario();
  if (!user) return { ok: false };
  const supabase = await createAuthClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
  return { ok: true };
}
