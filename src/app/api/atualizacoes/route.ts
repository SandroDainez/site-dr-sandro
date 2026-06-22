import { NextRequest, NextResponse } from "next/server";
import { getAtualizacoes, writeBlob } from "@/lib/content";
import type { AtualizacaoData } from "@/lib/content";

// ─── POST /api/atualizacoes ──────────────────────────────────────────────────
// Adiciona uma nova atualização clínica.
// Para usar: POST com header x-api-key e JSON body.
//
// Exemplo:
//   curl -X POST https://site-dr-sandro.vercel.app/api/atualizacoes \
//     -H "x-api-key: Jiujitsu#47" \
//     -H "Content-Type: application/json" \
//     -d '{
//       "titulo": "Nova atualização",
//       "conteudo": "Conteúdo em markdown...",
//       "area": "emergencias",
//       "data": "2026-06-22"
//     }'

function requireApiKey(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return "ERRO: ADMIN_PASSWORD não configurado no servidor.";
  }
  if (key !== expected) {
    return null; // unauthorized
  }
  return "ok";
}

const AREAS = ["emergencias", "ti", "anestesiologia"] as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const auth = requireApiKey(req);
  if (auth !== "ok") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // 2. Parse body
  let body: Partial<AtualizacaoData>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // 3. Validate required fields
  if (!body.titulo || typeof body.titulo !== "string") {
    return NextResponse.json({ error: "Campo 'titulo' é obrigatório." }, { status: 400 });
  }
  if (!body.conteudo || typeof body.conteudo !== "string") {
    return NextResponse.json({ error: "Campo 'conteudo' é obrigatório." }, { status: 400 });
  }
  if (!body.area || !AREAS.includes(body.area as any)) {
    return NextResponse.json(
      { error: "Campo 'area' deve ser: emergencias, ti ou anestesiologia." },
      { status: 400 }
    );
  }
  if (!body.data || typeof body.data !== "string") {
    return NextResponse.json({ error: "Campo 'data' é obrigatório (YYYY-MM-DD)." }, { status: 400 });
  }

  // 4. Normalize fields
  const id = body.id || slugify(body.titulo) + "-" + body.data;
  const newItem: AtualizacaoData = {
    id,
    titulo: body.titulo,
    conteudo: body.conteudo,
    area: body.area as AtualizacaoData["area"],
    data: body.data,
    imageUrl: body.imageUrl || "",
    imageCaption: body.imageCaption || "",
    link: body.link || "",
  };

  // 5. Read current data, append, save
  try {
    const current = await getAtualizacoes();
    const updated = [newItem, ...current]; // newest first
    await writeBlob("atualizacoes", updated);

    return NextResponse.json({ ok: true, id: newItem.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao salvar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── GET /api/atualizacoes ───────────────────────────────────────────────────
// Retorna a lista de atualizações (público, só leitura)
export async function GET() {
  try {
    const atualizacoes = await getAtualizacoes();
    return NextResponse.json(atualizacoes);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar atualizações" }, { status: 500 });
  }
}

// ─── PUT /api/atualizacoes ──────────────────────────────────────────────────
// Sobrescreve o array completo de uma vez (operação atômica).
export async function PUT(req: NextRequest) {
  const auth = requireApiKey(req);
  if (auth !== "ok") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  let body: AtualizacaoData[];
  try {
    body = await req.json();
    if (!Array.isArray(body)) throw new Error("esperado array");
  } catch {
    return NextResponse.json({ error: "JSON inválido: esperado array" }, { status: 400 });
  }
  try {
    await writeBlob("atualizacoes", body);
    return NextResponse.json({ ok: true, count: body.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro" }, { status: 500 });
  }
}

// ─── DELETE /api/atualizacoes ───────────────────────────────────────────────
// Remove uma atualização pelo ID.
// Requer x-api-key e JSON body com o id a remover.
export async function DELETE(req: NextRequest) {
  const auth = requireApiKey(req);
  if (auth !== "ok") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Campo 'id' é obrigatório." }, { status: 400 });
  }

  try {
    const current = await getAtualizacoes();
    const filtered = current.filter((item) => item.id !== body.id);
    if (filtered.length === current.length) {
      return NextResponse.json({ error: "ID não encontrado." }, { status: 404 });
    }
    await writeBlob("atualizacoes", filtered);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao remover";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
