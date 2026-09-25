import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";

// Upload do HTML interativo de um guia via SERVIDOR (não o client upload() direto pro
// Blob, que estava travando só com HTML). O navegador faz um POST multipart simples
// pra cá; a gente grava no Blob PRIVADO e devolve a URL. 1–2 MB cabe tranquilo no
// limite de corpo de uma Route Handler. O arquivo é servido depois pela rota
// /api/guia-interativo (inline + CSP).
export const runtime = "nodejs";

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const password = process.env.ADMIN_PASSWORD;
  if (!token || !password) return false;
  const expected = createHash("sha256").update(password).digest("hex");
  return token === expected;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return NextResponse.json({ error: "Blob token ausente" }, { status: 500 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
    }
    // ~8 MB de teto (um HTML autônomo com imagens embutidas raramente passa disso).
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo grande demais (máx 8 MB)" }, { status: 413 });
    }

    const nome = (file.name || "guia.html").replace(/[^\w.-]+/g, "_");
    const blob = await put(`protocolos/${Date.now()}-${nome}`, file, {
      access: "private",
      contentType: "text/html",
      addRandomSuffix: true,
      token: blobToken,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro no upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
