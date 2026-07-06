import { cookies } from "next/headers";
import { tokenAdminValido } from "@/lib/admin-token";

export { adminTokenEsperado, tokenAdminValido } from "@/lib/admin-token";

// Autenticação de ADMIN — ponto ÚNICO de verdade (ver docs/AUTH-ADMIN.md).
// Modelo atual: segredo compartilhado `ADMIN_PASSWORD` (server-only) → o login
// grava o cookie `admin_token = sha256(ADMIN_PASSWORD)`. O segredo vive em env var
// no servidor (NUNCA em user_metadata / NUNCA no client).
//
// Este helper é usado pelas 3 camadas de proteção:
//  (a) middleware (src/proxy.ts) — barra a rota /admin no edge;
//  (b) requireAdmin() — em TODA server action / route handler do admin;
//  (c) RLS no Supabase — impede query de não-admin retornar rascunho (independe daqui).
//
// Upgrade futuro (equipe de editores): trocar a checagem por role em app_metadata
// (JWT), sem mudar os call sites — todos passam por aqui.

// Lança se não for admin. Chamar no INÍCIO de toda server action / route handler do admin.
export async function requireAdmin(): Promise<void> {
  const token = (await cookies()).get("admin_token")?.value;
  if (!tokenAdminValido(token)) throw new Error("Não autorizado");
}

// Versão booleana (para Server Components decidirem exibição sem lançar).
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get("admin_token")?.value;
  return tokenAdminValido(token);
}
