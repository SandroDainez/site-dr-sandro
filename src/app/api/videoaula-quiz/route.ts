import { NextRequest, NextResponse } from "next/server";
import { getUsuario } from "@/lib/supabase/auth-server";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";

// Salva o resultado pré/pós de uma videoaula. Aberto a todos; só PERSISTE se logado.
// Anônimo (ou tabela ausente) → no-op silencioso, sempre 200 (a evolução é mostrada
// no cliente de qualquer forma).
export async function POST(req: NextRequest) {
  const user = await getUsuario();
  if (!user || !serviceConfigured()) return NextResponse.json({ ok: true, saved: false });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const { videoaulaId, titulo, total, scorePre, scorePos } = body ?? {};
  if (!videoaulaId || typeof scorePos !== "number") {
    return NextResponse.json({ ok: false, error: "dados inválidos" }, { status: 400 });
  }

  try {
    const sb = createServiceClient();
    await sb.from("videoaula_quiz_attempts").insert({
      user_id: user.id,
      videoaula_id: String(videoaulaId),
      titulo: String(titulo ?? ""),
      total: typeof total === "number" ? total : 0,
      score_pre: typeof scorePre === "number" ? scorePre : null,
      score_pos: scorePos,
    });
    return NextResponse.json({ ok: true, saved: true });
  } catch {
    return NextResponse.json({ ok: true, saved: false });
  }
}
