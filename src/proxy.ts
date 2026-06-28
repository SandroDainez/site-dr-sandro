import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16: "middleware" virou "proxy". Aqui só renovamos a sessão Supabase do
// usuário (cookies) a cada request, para Server Components verem quem está logado.
// Não bloqueia rota nenhuma; a proteção é feita nas páginas (ex.: /minha-area).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // sem config → não faz nada (site segue normal)

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // IMPORTANTE: getUser() renova o token quando necessário e atualiza os cookies.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // roda em tudo, menos estáticos, imagens, e as rotas de API (cron/agentes têm auth própria).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|txt|xml)$).*)"],
};
