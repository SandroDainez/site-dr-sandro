export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurso, getHeader } from "@/lib/content";
import { getUsuario, createAuthClient } from "@/lib/supabase/auth-server";
import { Award } from "lucide-react";
import PrintButton from "./PrintButton";

export const metadata = { title: "Certificado" };

export default async function CertificadoPage({ params }: { params: Promise<{ curso: string }> }) {
  const { curso: cursoId } = await params;
  const user = await getUsuario();
  if (!user) redirect(`/entrar?next=/certificado/${cursoId}`);

  const [curso, header] = await Promise.all([getCurso(cursoId), getHeader()]);
  if (!curso || !curso.titulo) redirect("/cursos");

  // Valida no servidor: concluiu TODAS as aulas?
  const supabase = await createAuthClient();
  const temQuiz = (curso.quiz?.length ?? 0) > 0;
  const [{ data: prog }, { data: perfil }, { data: ap }] = await Promise.all([
    supabase.from("course_progress").select("aula_id").eq("user_id", user.id).eq("curso_id", cursoId),
    supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle(),
    supabase.from("quiz_attempts").select("id").eq("user_id", user.id).eq("curso_id", cursoId).eq("aprovado", true).limit(1),
  ]);
  const feitas = new Set((prog ?? []).map((r: { aula_id: string }) => r.aula_id));
  const total = curso.aulas.length;
  const quizAprovado = !temQuiz || (ap ?? []).length > 0;
  const completo = total > 0 && curso.aulas.every((a) => feitas.has(a.id)) && quizAprovado;

  if (!completo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1420] px-6 text-center text-white">
        <div className="max-w-md">
          <p className="text-lg font-semibold">Conclua o curso para emitir o certificado.</p>
          <p className="mt-2 text-sm text-white/50">Marque todas as aulas como concluídas em <a href={`/cursos/${cursoId}`} className="text-accent">{curso.titulo}</a>.</p>
        </div>
      </div>
    );
  }

  const nome = perfil?.nome || user.email || "Participante";
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const codigo = `${cursoId.slice(0, 6)}-${user.id.slice(0, 8)}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#0f1420] px-6 py-10 text-white print:bg-white">
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff; } }`}</style>

      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-6 flex items-center justify-between">
          <a href={`/cursos/${cursoId}`} className="text-sm text-white/50 transition hover:text-white">← Voltar ao curso</a>
          <PrintButton />
        </div>

        {/* Certificado */}
        <div className="relative overflow-hidden rounded-2xl border-4 border-accent/40 bg-gradient-to-br from-[#0b1220] to-[#0a0f18] p-10 text-center print:border-accent print:from-white print:to-white print:text-black">
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background:radial-gradient(60%_50%_at_50%_0%,var(--accent,#2ce6b8),transparent)]" />
          <div className="relative">
            <Award className="mx-auto h-12 w-12 text-accent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-accent">Certificado de Conclusão</p>
            <p className="mt-8 text-sm text-white/60 print:text-black/60">Certificamos que</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{nome}</p>
            <p className="mt-6 text-sm text-white/60 print:text-black/60">concluiu com aproveitamento o curso</p>
            <p className="mt-2 text-xl font-semibold text-accent">{curso.titulo}</p>
            {curso.professor && <p className="mt-4 text-sm text-white/55 print:text-black/55">Instrutor(a): {curso.professor}</p>}

            <div className="mx-auto mt-10 flex max-w-md items-end justify-between border-t border-white/15 pt-5 text-xs text-white/50 print:border-black/20 print:text-black/60">
              <div className="text-left">
                <p className="font-semibold text-white print:text-black">{header.name || "Portal Médico"}</p>
                <p>Emitido em {hoje}</p>
              </div>
              <div className="text-right">
                <p>Código de validação</p>
                <p className="font-mono font-semibold text-white print:text-black">{codigo}</p>
              </div>
            </div>
          </div>
        </div>
        <p className="no-print mt-4 text-center text-xs text-white/35">Dica: na janela de impressão, escolha “Salvar como PDF”.</p>
      </div>
    </div>
  );
}
