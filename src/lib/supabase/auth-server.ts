import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Auth de USUÁRIO final (médicos) — mesma instância Supabase do conteúdo.
// Funciona sem chaves novas: usa NEXT_PUBLIC_SUPABASE_URL + ANON_KEY já existentes.
export function authConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Cliente Supabase no servidor COM sessão (lê/grava cookies). Use em páginas e
// server actions que precisam saber quem é o usuário logado.
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Chamado de um Server Component (sem permissão de escrever cookie):
            // ignora — o proxy.ts renova a sessão a cada request.
          }
        },
      },
    }
  );
}

// Usuário logado, validado no servidor (ou null). Seguro: usa getUser().
export async function getUsuario() {
  if (!authConfigured()) return null;
  try {
    const supabase = await createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}
