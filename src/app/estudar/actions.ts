"use server";

import { createAuthClient, getUsuario } from "@/lib/supabase/auth-server";

export type QuestaoSessao = { id: string; enunciado: string; opcoes: string[]; area?: string; tema?: string; nivel?: string };

const hojeISO = () => new Date().toISOString().slice(0, 10);
function embaralha<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor((i + 1) * (Date.now() % 997) / 997 + Math.random() * (i + 1)) % (i + 1); [x[i], x[j]] = [x[j], x[i]]; } return x; }

// Monta a sessão: questões VENCIDAS na revisão (SRS) + questões novas, sem a resposta.
export async function getSessao(area?: string, tamanho = 15): Promise<{ questoes: QuestaoSessao[]; pendentes: number }> {
  const user = await getUsuario();
  if (!user) return { questoes: [], pendentes: 0 };
  const supabase = await createAuthClient();

  // Gate: só membros liberados pelo admin estudam.
  const { data: perfilLib } = await supabase.from("profiles").select("liberado").eq("id", user.id).maybeSingle();
  if (!perfilLib?.liberado) return { questoes: [], pendentes: 0 };

  const [{ data: cards }, qResp] = await Promise.all([
    supabase.from("srs_cards").select("questao_id,proxima_revisao").eq("user_id", user.id),
    (area && area !== "todas"
      ? supabase.from("questoes").select("id,enunciado,opcoes,area,tema,nivel").eq("ativo", true).eq("area", area).limit(400)
      : supabase.from("questoes").select("id,enunciado,opcoes,area,tema,nivel").eq("ativo", true).limit(400)),
  ]);

  const hoje = hojeISO();
  const vistas = new Map<string, string>();
  for (const c of cards ?? []) vistas.set(c.questao_id, c.proxima_revisao);
  const pendentes = (cards ?? []).filter((c) => c.proxima_revisao <= hoje).length;

  const todas = (qResp.data ?? []) as any[];
  const vencidas = todas.filter((q) => vistas.has(q.id) && (vistas.get(q.id) as string) <= hoje);
  const novas = todas.filter((q) => !vistas.has(q.id));

  const sel = [...embaralha(vencidas), ...embaralha(novas)].slice(0, tamanho);
  return {
    questoes: sel.map((q) => ({ id: q.id, enunciado: q.enunciado, opcoes: q.opcoes, area: q.area, tema: q.tema, nivel: q.nivel })),
    pendentes,
  };
}

// Corrige NO SERVIDOR + atualiza o agendamento (SM-2 simplificado).
export async function responder(questaoId: string, resposta: number): Promise<{ ok: boolean; certo?: boolean; correta?: number; explicacao?: string; error?: string }> {
  const user = await getUsuario();
  if (!user) return { ok: false, error: "Sessão expirada." };
  const supabase = await createAuthClient();
  const { data: q } = await supabase.from("questoes").select("correta,explicacao").eq("id", questaoId).maybeSingle();
  if (!q) return { ok: false, error: "Questão não encontrada." };
  const certo = Number(resposta) === q.correta;

  const { data: card } = await supabase.from("srs_cards").select("*").eq("user_id", user.id).eq("questao_id", questaoId).maybeSingle();
  let ease = card?.ease ?? 2.5, intervalo = card?.intervalo ?? 0, repeticoes = card?.repeticoes ?? 0, lapsos = card?.lapsos ?? 0;
  let total_respostas = card?.total_respostas ?? 0, total_acertos = card?.total_acertos ?? 0;

  if (certo) {
    intervalo = repeticoes === 0 ? 1 : repeticoes === 1 ? 3 : Math.round(intervalo * ease);
    repeticoes += 1;
    ease = Math.min(3.0, ease + 0.05);
  } else {
    repeticoes = 0; intervalo = 1; lapsos += 1; ease = Math.max(1.3, ease - 0.2);
  }
  total_respostas += 1; total_acertos += certo ? 1 : 0;
  const prox = new Date(); prox.setDate(prox.getDate() + intervalo);

  await supabase.from("srs_cards").upsert({
    user_id: user.id, questao_id: questaoId, ease, intervalo, repeticoes, lapsos,
    proxima_revisao: prox.toISOString().slice(0, 10), total_respostas, total_acertos, atualizado_em: new Date().toISOString(),
  });
  // registra no log do dia (ofensiva/XP/analytics) — não bloqueia se falhar
  try { await supabase.rpc("registrar_estudo", { p_acerto: certo }); } catch {}

  return { ok: true, certo, correta: q.correta, explicacao: q.explicacao ?? undefined };
}

// Quantas questões estão pendentes de revisão hoje (para a Minha área).
export async function getPendentesHoje(): Promise<number> {
  const user = await getUsuario();
  if (!user) return 0;
  const supabase = await createAuthClient();
  const { count } = await supabase.from("srs_cards").select("questao_id", { count: "exact", head: true }).eq("user_id", user.id).lte("proxima_revisao", hojeISO());
  return count ?? 0;
}
