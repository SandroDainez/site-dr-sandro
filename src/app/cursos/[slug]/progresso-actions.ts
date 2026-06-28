"use server";

import { createAuthClient, getUsuario } from "@/lib/supabase/auth-server";
import { getCurso } from "@/lib/content";

// Corrige a avaliação NO SERVIDOR (não confia no cliente) e registra a tentativa.
export async function registrarQuiz(cursoId: string, respostas: number[]): Promise<{ ok: boolean; nota?: number; aprovado?: boolean; acertos?: number; total?: number; error?: string }> {
  const user = await getUsuario();
  if (!user) return { ok: false, error: "Entre na sua conta para registrar a nota." };
  const curso = await getCurso(cursoId);
  const quiz = curso?.quiz ?? [];
  if (quiz.length === 0) return { ok: false, error: "Este curso não tem avaliação." };
  let acertos = 0;
  quiz.forEach((q, i) => { if (Number(respostas[i]) === q.correta) acertos++; });
  const total = quiz.length;
  const nota = Math.round((acertos / total) * 100);
  const aprovado = nota >= (curso?.notaMinima ?? 70);
  try {
    const supabase = await createAuthClient();
    await supabase.from("quiz_attempts").insert({ user_id: user.id, curso_id: cursoId, acertos, total, nota, aprovado });
  } catch { /* segue mesmo se falhar o registro */ }
  return { ok: true, nota, aprovado, acertos, total };
}

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
