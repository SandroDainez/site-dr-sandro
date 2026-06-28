"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient, getUsuario } from "@/lib/supabase/auth-server";

type R = { ok: boolean; error?: string; msg?: string };

export async function salvarPerfil(_prev: R, formData: FormData): Promise<R> {
  const user = await getUsuario();
  if (!user) return { ok: false, error: "Sessão expirada. Entre de novo." };
  const nome = String(formData.get("nome") || "").trim();
  const especialidade = String(formData.get("especialidade") || "").trim();
  const crm = String(formData.get("crm") || "").trim();
  const supabase = await createAuthClient();
  const { error } = await supabase
    .from("profiles")
    .update({ nome, especialidade, crm, atualizado_em: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { ok: false, error: "Não foi possível salvar." };
  revalidatePath("/minha-area");
  return { ok: true, msg: "Perfil salvo." };
}
