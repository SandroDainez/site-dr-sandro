import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { verificarCronSecret, FONTES_EVENTOS_COMPLETAS } from "@/lib/agents/utils";

export const maxDuration = 300;

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getJanelaEventos() {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const anoSeguinte = anoAtual + 1;
  return {
    hoje: hoje.toISOString().split("T")[0],
    anoAtual,
    anoSeguinte,
    fimJanela: `${anoSeguinte}-06-30`,
  };
}

async function pesquisarEventos(): Promise<any[]> {
  const { hoje, anoAtual, anoSeguinte, fimJanela } = getJanelaEventos();

  const prompt = `Você é especialista em eventos científicos médicos.
Pesquise congressos, simpósios, workshops e cursos nas especialidades:
anestesiologia, terapia intensiva e medicina de emergência.

JANELA TEMPORAL: ${hoje} até ${fimJanela}
(Ano completo ${anoAtual} + primeiros 6 meses de ${anoSeguinte})

FONTES PARA PESQUISAR:
${FONTES_EVENTOS_COMPLETAS}

Para CADA evento encontrado retorne:
{
  "titulo": "nome oficial do evento",
  "descricao": "1-2 frases sobre conteúdo e público-alvo",
  "especialidades": ["anestesiologia" e/ou "terapia_intensiva" e/ou "emergencias"],
  "data_inicio": "YYYY-MM-DD",
  "data_fim": "YYYY-MM-DD",
  "local_nome": "nome do local ou plataforma online",
  "cidade": "cidade",
  "pais": "nome do país em português",
  "modalidade": "presencial" ou "online" ou "hibrido",
  "url_oficial": "URL REAL do site oficial do evento",
  "organizador": "sigla da sociedade organizadora"
}

COBERTURA OBRIGATÓRIA (não pode faltar):
- PRIORIZE os principais congressos do BRASIL: Congresso Brasileiro de Anestesiologia (CBA/SBA, ~novembro), Congresso Paulista de Anestesiologia (SAESP, ~abril), Congresso Brasileiro de Medicina Intensiva (CBMI/AMIB), Congresso Brasileiro de Medicina de Emergência (SBMU/ABRAMEDE) e os regionais relevantes.
- Inclua também os principais da AMÉRICA LATINA (CLASA e sociedades nacionais).
- E os grandes congressos MUNDIAIS (ASA, ESAIC, WFSA, ESICM, SCCM, ISICEM, ACEP, EuSEM, ERC, SAEM).
- Pesquise ativamente nos sites das sociedades (sba.com.br, saesp.org.br, amib.org.br, sbmu.org.br, abramede.com.br) para achar as datas reais dos eventos brasileiros.
- Busque de 15 a 30 eventos no total, bem distribuídos entre Brasil, América Latina e mundo.

REGRAS CRÍTICAS:
- url_oficial deve ser URL real e verificável — não invente. Se não achar a URL exata do congresso, use a do site da sociedade organizadora.
- Eventos sem URL verificável: OMITIR
- Não incluir eventos passados (anteriores a ${hoje})
- Retorne APENAS array JSON, sem markdown`;

  let tentativas = 0;
  while (tentativas < 3) {
    try {
      const response = await (getOpenAI().chat.completions.create as any)({
        model: "gpt-4o-search-preview",
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      });
      const texto = response.choices[0].message.content ?? "[]";
      // Extrai o array JSON mesmo que o modelo coloque texto/markdown ao redor.
      const semFence = texto.replace(/```json|```/g, "").trim();
      const m = semFence.match(/\[[\s\S]*\]/);
      const clean = m ? m[0] : (semFence.startsWith("[") ? semFence : `[${semFence}]`);
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      throw new Error("busca vazia");
    } catch {
      tentativas++;
      if (tentativas < 3) {
        await new Promise((res) => setTimeout(res, 3000 * tentativas));
      }
    }
  }

  // Fallback sem web search
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt + '\n\nRetorne um objeto JSON {"eventos": [...]} com o array de eventos.' }],
    max_tokens: 8000,
    response_format: { type: "json_object" },
  });
  const data = JSON.parse(response.choices[0].message.content ?? '{"eventos":[]}');
  if (Array.isArray(data)) return data;
  return data.eventos ?? data.events ?? data.congressos ?? [];
}

export async function POST(request: NextRequest) {
  if (!verificarCronSecret(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!serviceConfigured() || !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Supabase ou OpenAI não configurados" }, { status: 503 });
  }

  const supabase = createServiceClient();
  const { hoje, fimJanela } = getJanelaEventos();
  let inseridos = 0, atualizados = 0, ignorados = 0;

  // Desativar eventos passados
  await supabase
    .from("medical_events")
    .update({ ativo: false })
    .lt("data_inicio", hoje)
    .eq("ativo", true);

  const eventos = await pesquisarEventos();

  for (const ev of eventos) {
    if (!ev.url_oficial || !ev.data_inicio || !ev.titulo) { ignorados++; continue; }
    if (ev.data_inicio < hoje || ev.data_inicio > fimJanela) { ignorados++; continue; }

    const { data: existente } = await supabase
      .from("medical_events")
      .select("id")
      .or(`url_oficial.eq.${ev.url_oficial},and(titulo.eq.${ev.titulo},data_inicio.eq.${ev.data_inicio})`)
      .maybeSingle();

    if (existente) {
      await supabase.from("medical_events").update({
        data_fim: ev.data_fim ?? null,
        local_nome: ev.local_nome ?? null,
        cidade: ev.cidade ?? null,
        modalidade: ev.modalidade ?? null,
        descricao: ev.descricao ?? null,
        ativo: true,
        ultima_verificacao: new Date().toISOString(),
      }).eq("id", existente.id);
      atualizados++;
    } else {
      const { error } = await supabase.from("medical_events").insert({
        titulo: ev.titulo,
        descricao: ev.descricao ?? null,
        especialidades: Array.isArray(ev.especialidades) ? ev.especialidades : ["anestesiologia"],
        data_inicio: ev.data_inicio,
        data_fim: ev.data_fim ?? null,
        local_nome: ev.local_nome ?? null,
        cidade: ev.cidade ?? null,
        pais: ev.pais ?? "Brasil",
        modalidade: ev.modalidade ?? "presencial",
        url_oficial: ev.url_oficial,
        organizador: ev.organizador ?? null,
        destaque: false,
        ativo: true,
      });
      error ? ignorados++ : inseridos++;
    }
  }

  return NextResponse.json({
    status: "ok", inseridos, atualizados, ignorados,
    janela: { de: hoje, ate: fimJanela },
  });
}

// Vercel cron dispara via GET e injeta `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: NextRequest) {
  return POST(request);
}
