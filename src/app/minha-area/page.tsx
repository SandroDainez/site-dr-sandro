export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuario, createAuthClient } from "@/lib/supabase/auth-server";
import { getCursos } from "@/lib/content";
import { sair } from "@/app/entrar/actions";
import { getPendentesHoje } from "@/app/estudar/actions";
import { getDesempenho } from "@/app/desempenho/analytics";
import { BookOpen, Bookmark, GraduationCap, LogOut, Award, ArrowRight, Sparkles, Brain, Play, Flame, Trophy, BarChart3 } from "lucide-react";
import PerfilForm from "./PerfilForm";
import InstallButton from "@/components/InstallButton";
import NotificacoesToggle from "@/components/NotificacoesToggle";

export const metadata = { title: "Minha área" };

export default async function MinhaAreaPage() {
  const user = await getUsuario();
  // Sem login → vai pra HOME pública (não força login). Isto também conserta o PWA
  // já instalado que abria em /minha-area (start_url antigo): agora cai no site normal.
  // Login é feito pelo botão "Entrar"; a área de assinante segue protegida p/ quem entra.
  if (!user) redirect("/");

  let perfil: { nome?: string; especialidade?: string; crm?: string; liberado?: boolean } = {};
  const meusCursos: { id: string; titulo: string; feitas: number; total: number; pct: number; completo: boolean }[] = [];
  try {
    const supabase = await createAuthClient();
    const [{ data: prof }, { data: prog }, cursos] = await Promise.all([
      supabase.from("profiles").select("nome,especialidade,crm,liberado").eq("id", user.id).maybeSingle(),
      supabase.from("course_progress").select("curso_id,aula_id").eq("user_id", user.id),
      getCursos(),
    ]);
    if (prof) perfil = prof;
    // agrupa progresso por curso
    const porCurso = new Map<string, Set<string>>();
    for (const r of prog ?? []) {
      const s = porCurso.get(r.curso_id) ?? new Set<string>();
      s.add(r.aula_id);
      porCurso.set(r.curso_id, s);
    }
    for (const c of cursos) {
      const feitasSet = porCurso.get(c.id);
      if (!feitasSet || !c.titulo) continue;
      const total = c.aulas?.length ?? 0;
      const feitas = c.aulas?.filter((a) => feitasSet.has(a.id)).length ?? 0;
      if (feitas === 0) continue;
      const pct = total ? Math.round((feitas / total) * 100) : 0;
      meusCursos.push({ id: c.id, titulo: c.titulo, feitas, total, pct, completo: total > 0 && feitas === total });
    }
    meusCursos.sort((a, b) => b.pct - a.pct);
  } catch { /* vazio */ }

  // GATE de aprovação: conta confirmada mas ainda não liberada pelo admin.
  if (!perfil.liberado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1420] px-6 py-12 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 text-2xl">⏳</div>
          <h1 className="text-xl font-semibold">Conta em análise</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Seu e-mail foi confirmado! 🎉 Agora sua conta está <strong>aguardando a liberação</strong> da nossa equipe. Você receberá acesso à área de membro assim que for aprovada.
          </p>
          <p className="mt-3 text-xs text-white/40">{user.email}</p>
          <form action={sair} className="mt-6">
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm text-white/70 transition hover:text-white">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendentes = await getPendentesHoje().catch(() => 0);
  const desemp = await getDesempenho().catch(() => null);
  const primeiroNome = (perfil.nome || user.email || "").split(" ")[0] || "médico(a)";

  return (
    <div className="min-h-screen bg-[#0f1420] px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/" className="text-xs text-white/45 transition hover:text-white">← Início</Link>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Olá, {primeiroNome}</h1>
            <p className="mt-1 text-sm text-white/50">{user.email}</p>
          </div>
          <form action={sair}>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-red-400/40 hover:text-red-300">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </form>
        </div>

        {/* App do aluno: continuar + atalhos + instalar */}
        <div className="mb-6 space-y-3">
          {desemp && desemp.totalRespostas > 0 && (
            <a href="/desempenho" className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 transition hover:border-accent/40">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-300"><Flame className="h-4 w-4" /> {desemp.ofensiva}</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-accent"><Trophy className="h-4 w-4" /> Nível {desemp.nivel}</span>
                <span className="text-sm font-semibold text-white/70">{desemp.pctGeral}% acerto</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-white/45">Desempenho <BarChart3 className="h-3.5 w-3.5" /></span>
            </a>
          )}
          {meusCursos.find((c) => !c.completo) && (() => {
            const c = meusCursos.find((x) => !x.completo)!;
            return (
              <a href={`/cursos/${c.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/[0.07] p-4 transition hover:bg-accent/10">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Continuar de onde parou</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-white">{c.titulo}</p>
                  <p className="text-[11px] text-white/45">{c.feitas} de {c.total} aulas · {c.pct}%</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-[#0f1420]"><Play className="h-5 w-5" /></span>
              </a>
            );
          })()}
          {pendentes > 0 && (
            <a href="/estudar" className="flex items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-4 transition hover:bg-amber-400/10">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">Revisão de hoje</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{pendentes} {pendentes === 1 ? "questão pendente" : "questões pendentes"}</p>
                <p className="text-[11px] text-white/45">Repetição espaçada — fixa o que você aprendeu</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[#0f1420]"><Brain className="h-5 w-5" /></span>
            </a>
          )}
          <div className="grid grid-cols-2 gap-3">
            <a href="/estudar" className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white transition hover:border-accent/40"><Brain className="h-5 w-5 text-accent" /> Questões</a>
            <a href="/assistente" className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white transition hover:border-accent/40"><Sparkles className="h-5 w-5 text-accent" /> Assistente</a>
          </div>
          <InstallButton />
          <NotificacoesToggle />
        </div>

        {/* Meus cursos — progresso real */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center gap-2 text-accent"><GraduationCap className="h-5 w-5" /><h2 className="text-sm font-semibold text-white">Meus cursos</h2></div>
          {meusCursos.length === 0 ? (
            <p className="text-sm text-white/45">Você ainda não começou nenhum curso. <Link href="/cursos" className="text-accent">Ver cursos →</Link></p>
          ) : (
            <div className="space-y-3">
              {meusCursos.map((c) => (
                <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <a href={`/cursos/${c.id}`} className="text-sm font-semibold text-white transition hover:text-accent">{c.titulo}</a>
                    <span className="shrink-0 text-xs font-bold text-accent">{c.pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-accent" style={{ width: `${c.pct}%` }} /></div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
                    <span>{c.feitas} de {c.total} aulas</span>
                    {c.completo ? (
                      <a href={`/certificado/${c.id}`} className="inline-flex items-center gap-1 font-semibold text-accent"><Award className="h-3.5 w-3.5" /> Certificado</a>
                    ) : (
                      <a href={`/cursos/${c.id}`} className="inline-flex items-center gap-1 text-white/60 hover:text-white">Continuar <ArrowRight className="h-3 w-3" /></a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Salvos (próxima fase) */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-2 flex items-center gap-2 text-accent"><Bookmark className="h-5 w-5" /><h2 className="text-sm font-semibold text-white">Salvos</h2></div>
          <p className="text-sm text-white/45">Protocolos, atualizações e materiais que você salvar. (em breve)</p>
        </div>

        {/* Perfil */}
        <div id="perfil" className="scroll-mt-20 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent" /><h2 className="text-base font-semibold text-white">Meu perfil</h2></div>
          <PerfilForm perfil={perfil} />
        </div>
      </div>
    </div>
  );
}
