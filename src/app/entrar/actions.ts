"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthClient, authConfigured } from "@/lib/supabase/auth-server";

type R = { ok: boolean; error?: string; msg?: string };

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "medcampus.com.br";
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

// Entrar com e-mail + senha.
export async function entrarComSenha(_prev: R, formData: FormData): Promise<R> {
  if (!authConfigured()) return { ok: false, error: "Login indisponível no momento." };
  const email = String(formData.get("email") || "").trim();
  const senha = String(formData.get("senha") || "");
  if (!email || !senha) return { ok: false, error: "Preencha e-mail e senha." };
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { ok: false, error: "E-mail ou senha incorretos." };
  redirect("/minha-area");
}

// Criar conta (nome, especialidade, CRM opcionais via metadata → trigger cria o perfil).
export async function cadastrar(_prev: R, formData: FormData): Promise<R> {
  if (!authConfigured()) return { ok: false, error: "Cadastro indisponível no momento." };
  const email = String(formData.get("email") || "").trim();
  const senha = String(formData.get("senha") || "");
  const nome = String(formData.get("nome") || "").trim();
  const especialidade = String(formData.get("especialidade") || "").trim();
  const crm = String(formData.get("crm") || "").trim();
  if (!email || !senha) return { ok: false, error: "Preencha e-mail e senha." };
  if (senha.length < 6) return { ok: false, error: "A senha precisa ter pelo menos 6 caracteres." };
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome, especialidade, crm },
      emailRedirectTo: `${await origin()}/auth/callback`,
    },
  });
  if (error) return { ok: false, error: error.message.includes("registered") ? "Este e-mail já tem conta. Faça login." : "Não foi possível criar a conta." };
  // Se a confirmação de e-mail estiver ligada, não há sessão ainda.
  if (!data.session) return { ok: true, msg: "Conta criada! Enviamos um e-mail de confirmação — clique no link para ativar e entrar." };
  redirect("/minha-area");
}

// Link mágico (entrar sem senha — recebe um link por e-mail).
export async function enviarLinkMagico(_prev: R, formData: FormData): Promise<R> {
  if (!authConfigured()) return { ok: false, error: "Login indisponível no momento." };
  const email = String(formData.get("email") || "").trim();
  if (!email) return { ok: false, error: "Informe seu e-mail." };
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await origin()}/auth/callback` },
  });
  if (error) return { ok: false, error: "Não foi possível enviar o link. Tente de novo." };
  return { ok: true, msg: "Pronto! Enviamos um link de acesso para o seu e-mail." };
}

// Sair.
export async function sair() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/");
}
