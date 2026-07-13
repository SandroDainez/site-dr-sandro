import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new NextResponse("Token not configured", { status: 500 });

  try {
    // Encaminha o header Range para suportar streaming de vídeo
    // (o navegador precisa disso para tocar/buscar sem baixar tudo de uma vez)
    const range = req.headers.get("range");
    const upstreamHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (range) upstreamHeaders["Range"] = range;

    const res = await fetch(url, { headers: upstreamHeaders });
    if (!res.ok && res.status !== 206) {
      return new NextResponse("Not found", { status: res.status });
    }

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    // Respostas completas (200: imagens, PDFs) ganham s-maxage para o CDN da Vercel
    // guardar o arquivo e parar de rebaixá-lo do Blob a cada acesso — era isso que
    // inflava Blob Data Transfer + Fast Origin Transfer. A janela de frescor de 24h
    // (max-age) é a mesma de antes, então nenhuma imagem substituída fica "presa"
    // por mais tempo do que já ficava. Respostas parciais (206, streaming de vídeo
    // por Range) não são cacheadas pelo CDN de qualquer forma: mantemos só o cache
    // de navegador nelas.
    const isPartial = res.status === 206;
    const cacheControl = isPartial
      ? "public, max-age=86400"
      : "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";
    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "Accept-Ranges": "bytes",
    });

    // Repassa cabeçalhos essenciais para playback parcial de vídeo
    const contentLength = res.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);
    const contentRange = res.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);

    // Faz streaming do corpo direto (não carrega o arquivo inteiro na memória)
    return new NextResponse(res.body, {
      status: res.status, // 206 quando for resposta parcial (Range)
      headers,
    });
  } catch {
    return new NextResponse("Error fetching file", { status: 500 });
  }
}
