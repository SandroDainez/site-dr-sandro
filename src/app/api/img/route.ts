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
    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
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
