import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { tokenAdminValido } from "@/lib/admin-token";

// Domínio "de fábrica" que a Vercel cria a partir do nome do projeto — não dá pra apagar
// (é o domínio interno do projeto), mas favoritos/PWA salvos antes do domínio próprio
// existir ficam presos nele para sempre. Redireciona pro domínio de marca única.
const CANONICAL_HOST = "medcampus.com.br";
const HOSTS_ANTIGOS = new Set(["site-dr-sandro.vercel.app"]);

// Next 16: "middleware" virou "proxy". Faz três coisas:
//  (0) Redireciona o domínio antigo da Vercel (*.vercel.app) pro domínio de marca única —
//      sem isso, quem tem o app salvo desde antes do domínio próprio cai sempre no antigo.
//  (1) CAMADA (a) de segurança do admin: barra /admin no edge para quem não tem o
//      cookie admin válido (redireciona para /admin-login). Defesa em profundidade —
//      o layout do admin e cada action também checam (camada b). Ver docs/AUTH-ADMIN.md.
//  (2) Renova a sessão Supabase (cookies) a cada request, para os Server Components.
export async function proxy(request: NextRequest) {
  // ── Camada (0): domínio canônico único ─────────────────────────────────────
  const host = request.headers.get("host") || "";
  if (HOSTS_ANTIGOS.has(host)) {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(url, 308);
  }

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
