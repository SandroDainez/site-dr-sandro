"use server";

import { createAuthClient, getUsuario } from "@/lib/supabase/auth-server";

// Marca/desmarca uma aula como concluída para o usuário logado.
export async function marcarAula(cursoId: string, aulaId: string, concluir: boolean): Promise<{ ok: boolean }> {
  const user = await getUsuario();
  if (!user) return { ok: false };
  const supabase = await createAuthClient();
  if (concluir) {
    await supabase.from("course_progress").upsert({
      user_id: user.id, curso_id: cursoId, aula_id: aulaId, concluida_em: new Date().toISOString(),
    });
  } else {
    await supabase.from("course_progress").delete().eq("user_id", user.id).eq("curso_id", cursoId).eq("aula_id", aulaId);
  }
  return { ok: true };
}
