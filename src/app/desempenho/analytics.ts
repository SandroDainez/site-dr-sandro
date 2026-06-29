import { createAuthClient, getUsuario } from "@/lib/supabase/auth-server";

const AREA_LABEL: Record<string, string> = {
  anestesiologia: "Anestesiologia", terapia_intensiva: "Terapia Intensiva", emergencias: "Emergência", geral: "Geral",
};

export type Desempenho = {
  totalRespostas: number; totalAcertos: number; pctGeral: number;
  ofensiva: number; xp: number; nivel: number; xpNivel: number; xpProxNivel: number;
  diasAtivos: number;
  porArea: { area: string; label: string; respostas: number; acertos: number; pct: number }[];
  atividade: { dia: string; respostas: number }[]; // últimos 14 dias
  conquistas: { id: string; titulo: string; desc: string; obtida: boolean }[];
  // Evolução pré/pós das videoaulas (última tentativa por aula)
  videoaulas: { id: string; titulo: string; total: number; pctPre: number | null; pctPos: number; ganho: number | null }[];
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

export async function getDesempenho(): Promise<Desempenho | null> {
  const user = await getUsuario();
  if (!user) return null;
  const supabase = await createAuthClient();

  const [{ data: logs }, { data: cards }, { data: vqa }] = await Promise.all([
    supabase.from("study_log").select("dia,respostas,acertos").eq("user_id", user.id),
    supabase.from("srs_cards").select("total_respostas,total_acertos,questoes(area)").eq("user_id", user.id),
    supabase.from("videoaula_quiz_attempts").select("videoaula_id,titulo,total,score_pre,score_pos,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const log = logs ?? [];
  const totalRespostas = log.reduce((n, l) => n + (l.respostas || 0), 0);
  const totalAcertos = log.reduce((n, l) => n + (l.acertos || 0), 0);
  const pctGeral = totalRespostas ? Math.round((totalAcertos / totalRespostas) * 100) : 0;
  const diasAtivos = log.length;

  // ofensiva (dias consecutivos terminando hoje ou ontem)
  const diasSet = new Set(log.map((l) => l.dia));
  let ofensiva = 0;
  const hoje = new Date();
  const inicio = diasSet.has(iso(hoje)) ? new Date(hoje) : (() => { const y = new Date(hoje); y.setDate(y.getDate() - 1); return diasSet.has(iso(y)) ? y : null; })();
  if (inicio) { const d = new Date(inicio); while (diasSet.has(iso(d))) { ofensiva++; d.setDate(d.getDate() - 1); } }

  // XP e nível (cada resposta = 1, cada acerto = +1)
  const xp = totalRespostas + totalAcertos;
  const nivel = Math.floor(xp / 100) + 1;
  const xpNivel = xp % 100;
  const xpProxNivel = 100;

  // desempenho por área
  const mapa = new Map<string, { respostas: number; acertos: number }>();
  for (const c of cards ?? []) {
    const area = ((c as any).questoes?.area) || "geral";
    const m = mapa.get(area) ?? { respostas: 0, acertos: 0 };
    m.respostas += (c as any).total_respostas || 0;
    m.acertos += (c as any).total_acertos || 0;
    mapa.set(area, m);
  }
  const porArea = [...mapa.entries()].map(([area, m]) => ({ area, label: AREA_LABEL[area] ?? area, respostas: m.respostas, acertos: m.acertos, pct: m.respostas ? Math.round((m.acertos / m.respostas) * 100) : 0 })).sort((a, b) => b.respostas - a.respostas);

  // atividade últimos 14 dias
  const atividade: { dia: string; respostas: number }[] = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(hoje); d.setDate(d.getDate() - i); const k = iso(d); atividade.push({ dia: k, respostas: log.find((l) => l.dia === k)?.respostas ?? 0 }); }

  // conquistas
  const melhorArea = porArea.find((a) => a.respostas >= 20 && a.pct >= 90);
  const conquistas = [
    { id: "inicio", titulo: "Primeiros passos", desc: "Respondeu sua 1ª questão", obtida: totalRespostas >= 1 },
    { id: "c100", titulo: "Centena", desc: "100 questões respondidas", obtida: totalRespostas >= 100 },
    { id: "c500", titulo: "Maratonista", desc: "500 questões respondidas", obtida: totalRespostas >= 500 },
    { id: "of7", titulo: "Semana de fogo", desc: "7 dias seguidos estudando", obtida: ofensiva >= 7 },
    { id: "of30", titulo: "Disciplina de ferro", desc: "30 dias seguidos", obtida: ofensiva >= 30 },
    { id: "esp", titulo: melhorArea ? `Craque em ${melhorArea.label}` : "Especialista", desc: "≥90% numa área (mín. 20 questões)", obtida: !!melhorArea },
  ];

  // Videoaulas: última tentativa por aula (vqa já vem do mais recente p/ o mais antigo)
  const vistos = new Set<string>();
  const videoaulas: Desempenho["videoaulas"] = [];
  for (const a of vqa ?? []) {
    const id = (a as any).videoaula_id;
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    const total = (a as any).total || 0;
    const pre = (a as any).score_pre;
    const pos = (a as any).score_pos ?? 0;
    const pctPre = total && typeof pre === "number" ? Math.round((pre / total) * 100) : null;
    const pctPos = total ? Math.round((pos / total) * 100) : 0;
    videoaulas.push({
      id, titulo: (a as any).titulo || "Videoaula", total,
      pctPre, pctPos, ganho: pctPre === null ? null : pctPos - pctPre,
    });
  }

  return { totalRespostas, totalAcertos, pctGeral, ofensiva, xp, nivel, xpNivel, xpProxNivel, diasAtivos, porArea, atividade, conquistas, videoaulas };
}
