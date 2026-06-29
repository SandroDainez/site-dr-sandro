"use server";

import { cookies } from "next/headers";
import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";

async function requireAdmin() {
  const token = (await cookies()).get("admin_token")?.value;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || token !== createHash("sha256").update(pw).digest("hex")) throw new Error("Não autorizado");
}

type Result = { ok: true } | { ok: false; error: string };

export type UsuarioAdmin = {
  id: string;
  email: string;
  nome: string;
  especialidade: string;
  crm: string;
  liberado: boolean;
  confirmado: boolean;   // e-mail confirmado
  criado_em: string;
};

// Lista todos os usuários (auth) + dados do perfil (nome, liberado).
export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  await requireAdmin();
  if (!serviceConfigured()) return [];
  const sb = createServiceClient();
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = list?.users ?? [];
  const { data: profs } = await sb.from("profiles").select("id,nome,especialidade,crm,liberado");
  const pmap = new Map((profs ?? []).map((p: any) => [p.id, p]));
  return users
    .map((u: any) => {
      const p: any = pmap.get(u.id) ?? {};
      return {
        id: u.id,
        email: u.email ?? "",
        nome: p.nome ?? (u.user_metadata?.nome ?? ""),
        especialidade: p.especialidade ?? "",
        crm: p.crm ?? "",
        liberado: !!p.liberado,
        confirmado: !!u.email_confirmed_at,
        criado_em: u.created_at ?? "",
      };
    })
    .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
}

// Libera ou bloqueia o acesso de um usuário (flag profiles.liberado).
export async function setLiberado(userId: string, liberado: boolean): Promise<Result> {
  try {
    await requireAdmin();
    const sb = createServiceClient();
    // garante a linha do perfil (caso o trigger não tenha criado) e atualiza só o liberado
    const { error } = await sb.from("profiles").upsert({ id: userId, liberado }, { onConflict: "id" });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

// Exclui o usuário de vez (conta + login).
export async function excluirUsuario(userId: string): Promise<Result> {
  try {
    await requireAdmin();
    const sb = createServiceClient();
    const { error } = await sb.auth.admin.deleteUser(userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

// Cria um usuário manualmente (já confirmado e já liberado).
export async function cadastrarUsuario(input: { email: string; senha: string; nome?: string; especialidade?: string; crm?: string }): Promise<Result> {
  try {
    await requireAdmin();
    const email = (input.email || "").trim().toLowerCase();
    const senha = input.senha || "";
    if (!email || senha.length < 6) return { ok: false, error: "Informe e-mail e senha (mín. 6 caracteres)." };
    const sb = createServiceClient();
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // admin cadastrou → já confirmado
      user_metadata: { nome: input.nome || "", especialidade: input.especialidade || "", crm: input.crm || "" },
    });
    if (error) return { ok: false, error: error.message };
    const uid = data.user?.id;
    if (uid) {
      await sb.from("profiles").upsert({ id: uid, nome: input.nome || "", especialidade: input.especialidade || "", crm: input.crm || "", liberado: true }, { onConflict: "id" });
    }
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}
