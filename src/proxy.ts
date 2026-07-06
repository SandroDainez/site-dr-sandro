import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { tokenAdminValido } from "@/lib/admin-token";

// Next 16: "middleware" virou "proxy". Faz duas coisas:
//  (1) CAMADA (a) de segurança do admin: barra /admin no edge para quem não tem o
//      cookie admin válido (redireciona para /admin-login). Defesa em profundidade —
//      o layout do admin e cada action também checam (camada b). Ver docs/AUTH-ADMIN.md.
//  (2) Renova a sessão Supabase (cookies) a cada request, para os Server Components.
export async function proxy(request: NextRequest) {
  // ── Camada (a): gate do admin no edge ──────────────────────────────────────
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin-login")) {
    const token = request.cookies.get("admin_token")?.value;
    if (!tokenAdminValido(token)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

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
