import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/ai/openai";
import { verificarCronSecret } from "@/lib/agents/utils";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { getContato } from "@/lib/content";

type Lacuna = { tema?: string; evidencia?: string; sugestao?: string; tipo?: string; prioridade?: string };
type RelatorioConteudo = {
  resumo?: string;
  lacunas?: Lacuna[];
  perguntas_sem_resposta?: string[];
  acoes?: string[];
  dados?: Record<string, number>;
};

// Envia o relatório por e-mail via Resend (só se RESEND_API_KEY estiver configurado).
// Destinatário: RELATORIO_EMAIL ou, na falta, o e-mail de contato do site.
async function enviarPorEmail(resumo: string, conteudo: RelatorioConteudo, gerado_em: string): Promise<{ ok: boolean; reason: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: "sem_RESEND_API_KEY_no_ambiente" };
  let dest = process.env.RELATORIO_EMAIL || "";
  if (!dest) { try { dest = (await getContato()).email || ""; } catch {} }
  if (!dest) return { ok: false, reason: "sem_destinatario (defina RELATORIO_EMAIL ou e-mail de contato)" };
  const esc = (s: unknown) => String(s ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lac = (conteudo.lacunas ?? []).map((l: Lacuna) => `<li><b>${esc(l.tema)}</b> <i>(${esc(l.prioridade)})</i> — ${esc(l.sugestao)}</li>`).join("");
  const acoes = (conteudo.acoes ?? []).map((a: string) => `<li>${esc(a)}</li>`).join("");
  const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:600px">
    <h2 style="margin:0 0 8px">📊 Sugestões de melhoria — MedCampus</h2>
    <p style="color:#555">${esc(gerado_em)}</p>
    <p>${esc(resumo)}</p>
    ${lac ? `<h3>Lacunas de conteúdo</h3><ul>${lac}</ul>` : ""}
    ${acoes ? `<h3>Ações prioritárias</h3><ol>${acoes}</ol>` : ""}
    <p style="color:#999;font-size:12px;margin-top:24px">Gerado automaticamente pelo agente de melhoria. Veja completo em medcampus.com.br/admin/melhoria</p>
  </div>`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "MedCampus <nao-responda@medcampus.com.br>", to: [dest], subject: `📊 Sugestões de melhoria — ${gerado_em}`, html }),
    });
    if (r.ok) return { ok: true, reason: "enviado" };
    let detalhe = "";
    try { detalhe = JSON.stringify(await r.json()).slice(0, 200); } catch {}
    return { ok: false, reason: `resend_${r.status}: ${detalhe}` };
  } catch (e) { return { ok: false, reason: "excecao: " + (e instanceof Error ? e.message : "erro") }; }
}

export const maxDuration = 120;

// AGENTE DE MELHORIA: lê a DEMANDA real (buscas sem resultado + perguntas que o
// assistente não soube responder) dos últimos 30 dias e sugere o que adicionar ao
// portal. Apenas SUGERE — não altera nada. Roda semanal (cron) ou sob demanda.
export async function POST(request: NextRequest) {
  if (!verificarCronSecret(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!serviceConfigured() || !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Supabase ou OpenAI não configurados" }, { status: 503 });
  }
  const sb = createServiceClient();
  const desde = new Date(Date.now() - 30 * 86400000).toISOString();

  // 1) Buscas SEM resultado (lacunas de conteúdo mais diretas)
  const { data: buscas } = await sb.from("search_queries").select("termo").eq("resultados", 0).gte("created_at", desde);
  const buscasTop = contar((buscas ?? []).map((b: { termo?: string | null }) => String(b.termo || "").toLowerCase().trim())).slice(0, 20);

  // 2) Perguntas que o assistente NÃO respondeu (sem fonte no portal)
  const { data: perg } = await sb.from("assistant_queries").select("pergunta").eq("sem_fonte", true).gte("created_at", desde);
  const pergTop = contar((perg ?? []).map((p: { pergunta?: string | null }) => String(p.pergunta || "").trim())).slice(0, 20);

  // 3) Volume geral (pra contexto)
  const { count: totalBuscas } = await sb.from("search_queries").select("*", { count: "exact", head: true }).gte("created_at", desde);
  const { count: totalPerg } = await sb.from("assistant_queries").select("*", { count: "exact", head: true }).gte("created_at", desde);

  const semDados = buscasTop.length === 0 && pergTop.length === 0;
  let conteudo: RelatorioConteudo;
  let resumo: string;

  if (semDados) {
    resumo = "Sem demanda registrada ainda nos últimos 30 dias (poucas buscas/perguntas). Conforme o uso crescer, este relatório aponta lacunas de conteúdo.";
    conteudo = { resumo, lacunas: [], perguntas_sem_resposta: [], acoes: [], dados: { totalBuscas: totalBuscas ?? 0, totalPerguntas: totalPerg ?? 0 } };
  } else {
    const lista = (arr: { item: string; n: number }[]) => arr.map((x) => `- "${x.item}" (${x.n}x)`).join("\n") || "(nenhum)";
    const prompt = `Você é um estrategista de conteúdo de uma plataforma médica (anestesiologia, terapia intensiva, medicina de emergência). Com base na DEMANDA REAL abaixo, sugira o que ADICIONAR ao portal. Baseie-se SOMENTE nestes dados — não invente demanda.

BUSCAS SEM RESULTADO (últimos 30 dias):
${lista(buscasTop)}

PERGUNTAS QUE O ASSISTENTE NÃO SOUBE RESPONDER:
${lista(pergTop)}

Agrupe temas parecidos. Para cada lacuna, diga o tema, a evidência (o que os usuários procuraram), o tipo de conteúdo sugerido (protocolo, videoaula, boletim, referência na biblioteca) e a prioridade (alta/média/baixa).

Retorne APENAS JSON:
{
  "resumo": "2-3 frases com o panorama da semana",
  "lacunas": [{"tema":"...","evidencia":"...","sugestao":"...","tipo":"protocolo|videoaula|boletim|referencia|outro","prioridade":"alta|media|baixa"}],
  "perguntas_sem_resposta": ["...as perguntas mais relevantes que merecem material..."],
  "acoes": ["...3 a 5 ações concretas e priorizadas..."]
}`;
    try {
      const openai = getOpenAI();
      const r = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });
      conteudo = JSON.parse(r.choices[0].message.content ?? "{}");
      conteudo.dados = { totalBuscas: totalBuscas ?? 0, totalPerguntas: totalPerg ?? 0, buscasSemResultado: buscasTop.length, perguntasSemFonte: pergTop.length };
      resumo = String(conteudo.resumo ?? "Relatório de melhoria gerado.");
    } catch (e) {
      return NextResponse.json({ error: "Falha na síntese: " + (e instanceof Error ? e.message : "erro") }, { status: 502 });
    }
  }

  const gerado_em = new Date().toISOString().slice(0, 10);
  await sb.from("improvement_reports").insert({ gerado_em, resumo, conteudo });
  const email = await enviarPorEmail(resumo, conteudo, gerado_em);
  return NextResponse.json({ status: "ok", gerado_em, resumo, lacunas: conteudo.lacunas?.length ?? 0, emailed: email.ok, emailReason: email.reason });
}

export async function GET(request: NextRequest) { return POST(request); }

// Conta ocorrências e ordena por frequência.
function contar(itens: string[]): { item: string; n: number }[] {
  const m = new Map<string, number>();
  for (const it of itens) { if (!it || it.length < 2) continue; m.set(it, (m.get(it) ?? 0) + 1); }
  return [...m.entries()].map(([item, n]) => ({ item, n })).sort((a, b) => b.n - a.n);
}
