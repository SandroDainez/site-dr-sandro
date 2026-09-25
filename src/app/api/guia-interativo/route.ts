import { NextRequest, NextResponse } from "next/server";

// Serve o HTML INTERATIVO de um guia (blob privado) para embutir em <iframe>.
// Por que uma rota própria (e não o /api/img)?
//  - Entrega text/html INLINE (sem content-disposition), então o iframe RENDERIZA
//    em vez de baixar o arquivo.
//  - Mesma origem → o doc tem uma origem REAL: localStorage, tema e a navegação da
//    barra lateral funcionam (o /api/img com sandbox opaco quebrava o localStorage).
//  - Um CSP forte tranca o doc: ele pode renderizar (estilos/scripts embutidos) mas
//    NÃO consegue chamar APIs do site, enviar formulários nem baixar recursos externos
//    (connect/form/base bloqueados; imagens só data:/blob:). Como o upload é só de
//    admin (conteúdo próprio) e agora ainda vem trancado, o risco de ser mesma origem
//    fica neutralizado.
// O interativo é só para VER (sem download); quem quer levar embora usa o PDF.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new NextResponse("Token not configured", { status: 500 });

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return new NextResponse("Not found", { status: res.status });

    const csp = [
      "default-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "connect-src 'none'",
      "img-src data: blob:",
      "media-src data: blob:",
      "font-src data:",
      "style-src 'unsafe-inline'",
      "script-src 'unsafe-inline'",
      "frame-src 'none'",
      "child-src 'none'",
    ].join("; ");

    const headers = new Headers({
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": csp,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    });

    return new NextResponse(res.body, { status: 200, headers });
  } catch {
    return new NextResponse("Error fetching file", { status: 500 });
  }
}
