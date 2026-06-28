import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient } from "@/lib/supabase/auth-server";

// Destino dos links de confirmação de e-mail / link mágico: troca o ?code= por
// uma sessão e manda o usuário para a Minha área (ou para `next`).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/minha-area";

  if (code) {
    try {
      const supabase = await createAuthClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      return NextResponse.redirect(`${origin}/entrar?erro=link`);
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
