import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { verificarCronSecret } from "@/lib/agents/utils";

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

// Esquema de cada evento + regras, compartilhados por todas as buscas focadas.
function schemaERegras(hoje: string, fimJanela: string): string {
  return `Para CADA evento retorne um objeto:
{
  "titulo": "nome oficial",
  "descricao": "1-2 frases sobre conteúdo e público-alvo",
  "especialidades": ["anestesiologia" e/ou "terapia_intensiva" e/ou "emergencias"],
  "data_inicio": "YYYY-MM-DD",
  "data_fim": "YYYY-MM-DD",
  "local_nome": "nome do local ou plataforma",
  "cidade": "cidade",
  "pais": "país em português",
  "modalidade": "presencial" | "online" | "hibrido",
  "url_oficial": "URL REAL do site oficial (ou do site da sociedade organizadora)",
  "organizador": "sigla da sociedade",
  "slug_marco": "SÓ p/ marcos: CBMEDE→'cbmede', COPA SAESP→'copa-saesp', CBA→'cba', CBMI→'cbmi', CLASA→'clasa'. Senão omita."
}

CONGRESSOS-MARCO: se achar a data OFICIAL e exata de um marco (CBMEDE, COPA SAESP, CBA, CBMI, CLASA),
inclua o "slug_marco" certo + a data real — o sistema usa isso para confirmar automaticamente a data.

REGRAS:
- url_oficial REAL e verificável — nunca invente. Sem URL confiável: OMITA o evento.
- Só eventos na janela ${hoje} a ${fimJanela} (nada antes de ${hoje}).
- Prefira datas oficiais; se não tiver certeza da data, não inclua o evento.
- Retorne APENAS um array JSON (sem markdown, sem texto ao redor).`;
}

// Buscas FOCADAS: cada uma é estreita (um nicho), o que torna a cobertura muito
// mais confiável do que uma única consulta gigante. Rodam em paralelo e se juntam.
function getFocos(hoje: string, fimJanela: string): { id: string; instrucao: string }[] {
  const base = schemaERegras(hoje, fimJanela);
  return [
    { id: "anestesia-br", instrucao: `Liste os principais congressos de ANESTESIOLOGIA no BRASIL na janela. Inclua obrigatoriamente: Congresso Brasileiro de Anestesiologia (CBA/SBA, ~novembro), Congresso Paulista de Anestesiologia (COPA/SAESP, ~abril) e os congressos regionais das sociedades estaduais (SBA: sba.com.br; SAESP: saesp.org.br). 5 a 10 eventos.\n\n${base}` },
    { id: "ti-br", instrucao: `Liste os principais congressos de TERAPIA INTENSIVA / MEDICINA INTENSIVA no BRASIL na janela. Inclua obrigatoriamente: Congresso Brasileiro de Medicina Intensiva (CBMI/AMIB) e eventos regionais da AMIB (amib.org.br), além do Congresso Luso-Brasileiro. 5 a 10 eventos.\n\n${base}` },
    { id: "emergencia-br", instrucao: `Liste os principais congressos de MEDICINA DE EMERGÊNCIA no BRASIL na janela. Inclua obrigatoriamente: Congresso Brasileiro de Medicina de Emergência (CBMEDE/ABRAMEDE: abramede.com.br, cbmede.com.br) e eventos da SBMU (sbmu.org.br). 5 a 10 eventos.\n\n${base}` },
    { id: "america-latina", instrucao: `Liste os principais congressos de ANESTESIOLOGIA, TERAPIA INTENSIVA e MEDICINA DE EMERGÊNCIA na AMÉRICA LATINA (fora do Brasil) na janela. Inclua: CLASA (anestesiaclasa.org), FEPIMCTI (fepimcti.org) e congressos das sociedades nacionais (Argentina, México, Colômbia, Chile, Peru, Uruguai). 5 a 10 eventos.\n\n${base}` },
    { id: "mundo-anestesia", instrucao: `Liste os grandes congressos MUNDIAIS de ANESTESIOLOGIA na janela: ASA Annual Meeting, Euroanaesthesia (ESAIC), World Congress of Anaesthesiologists (WFSA/WCA) e outros de relevância global. 5 a 10 eventos.\n\n${base}` },
    { id: "mundo-ti-emergencia", instrucao: `Liste os grandes congressos MUNDIAIS de TERAPIA INTENSIVA e MEDICINA DE EMERGÊNCIA na janela: ESICM LIVES, SCCM Critical Care Congress, ISICEM, ACEP Scientific Assembly, EuSEM, ERC, SAEM. 5 a 10 eventos.\n\n${base}` },
  ];
}

// Uma busca focada: web search com retry + parsing robusto + fallback sem busca.
async function buscarFoco(instrucao: string): Promise<any[]> {
  const prompt = `Você é especialista em eventos científicos médicos. ${instrucao}`;
  for (let t = 0; t < 2; t++) {
    try {
      const response = await (getOpenAI().chat.completions.create as any)({
        model: "gpt-4o-search-preview",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });
      const texto = response.choices[0].message.content ?? "[]";
      const semFence = texto.replace(/```json|```/g, "").trim();
      const m = semFence.match(/\[[\s\S]*\]/);
      const clean = m ? m[0] : (semFence.startsWith("[") ? semFence : `[${semFence}]`);
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      throw new Error("foco vazio");
    } catch {
      if (t === 0) await new Promise((r) => setTimeout(r, 2500));
    }
  }
  // Fallback sem web search (conhecimento do modelo)
  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt + '\n\nRetorne {"eventos":[...]}.' }],
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });
    const data = JSON.parse(response.choices[0].message.content ?? '{"eventos":[]}');
    return Array.isArray(data) ? data : (data.eventos ?? data.events ?? data.congressos ?? []);
  } catch {
    return [];
  }
}

// Roda todas as buscas focadas em paralelo e junta os resultados, deduplicando.
async function pesquisarEventos(): Promise<any[]> {
  const { hoje, fimJanela } = getJanelaEventos();
  const focos = getFocos(hoje, fimJanela);
  const resultados = await Promise.all(focos.map((f) => buscarFoco(f.instrucao)));
  const todos = resultados.flat().filter((e) => e && e.titulo && e.url_oficial && e.data_inicio);

  // Dedup: por slug_marco, senão por url_oficial, senão por título+data.
  const vistos = new Set<string>();
  const unicos: any[] = [];
  for (const e of todos) {
    const chave = (e.slug_marco?.trim() || e.url_oficial?.trim() || `${e.titulo}|${e.data_inicio}`).toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    unicos.push(e);
  }
  return unicos;
}

// Confirma uma data de congresso-marco SÓ se ela aparecer no site oficial.
// Exige o DIA próximo do mês (pt/en), ou dd/mm/aaaa, ou ISO — e o ano na página.
// Falso-negativo (não confirma) é o lado seguro: o evento segue "a confirmar".
async function verificarDataNaFonte(url: string, dataISO: string): Promise<boolean> {
  try {
    const [y, mm, dd] = dataISO.split("-");
    const dia = String(Number(dd));
    const mesesPt = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const mesesEn = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const mp = mesesPt[Number(mm) - 1], me = mesesEn[Number(mm) - 1];
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0" } }).catch(() => null);
    clearTimeout(tid);
    if (!res || !res.ok) return false;
    const html = (await res.text()).toLowerCase().replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    if (!html.includes(y)) return false; // precisa do ano na página
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const perto = (a: string, b: string) => new RegExp(`${esc(a)}[\\s\\S]{0,25}${esc(b)}`, "i").test(html);
    return (
      perto(dia, mp) || perto(mp, dia) ||
      perto(dia, me) || perto(me, dia) ||
      html.includes(`${dd}/${mm}/${y}`) || html.includes(`${dia}/${mm}/${y}`) ||
      html.includes(dataISO)
    );
  } catch {
    return false;
  }
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

    // Casa primeiro pela chave de congresso-marco (slug_marco) — assim um marco que
    // estava "a confirmar" é atualizado com a data oficial. Senão, casa por URL/título.
    const slug = typeof ev.slug_marco === "string" && ev.slug_marco.trim() ? ev.slug_marco.trim() : null;
    const cols = "id,data_confirmada,data_inicio,data_fim";
    let existente: { id: string; data_confirmada: boolean; data_inicio: string; data_fim: string | null } | null = null;
    if (slug) {
      const { data } = await supabase.from("medical_events").select(cols).eq("slug_marco", slug).maybeSingle();
      existente = (data as any) ?? null;
    }
    if (!existente) {
      const { data } = await supabase
        .from("medical_events")
        .select(cols)
        .or(`url_oficial.eq.${ev.url_oficial},and(titulo.eq.${ev.titulo},data_inicio.eq.${ev.data_inicio})`)
        .maybeSingle();
      existente = (data as any) ?? null;
    }

    if (existente) {
      // Congresso-marco AINDA não confirmado: só aceita/confirma a nova data se ela
      // REALMENTE aparecer no site oficial (evita "confirmar" data chutada pelo modelo).
      const marcoPendente = !!slug && existente.data_confirmada === false;
      let novaData = ev.data_inicio;
      let novaDataFim = ev.data_fim ?? null;
      let confirmar = true;
      if (marcoPendente) {
        const verificada = await verificarDataNaFonte(ev.url_oficial, ev.data_inicio);
        if (!verificada) {
          // não confirma: mantém a data provisória e o status "a confirmar"
          novaData = existente.data_inicio;
          novaDataFim = existente.data_fim;
          confirmar = false;
        }
      }
      await supabase.from("medical_events").update({
        data_inicio: novaData,
        data_fim: novaDataFim,
        local_nome: ev.local_nome ?? null,
        cidade: ev.cidade ?? null,
        modalidade: ev.modalidade ?? null,
        descricao: ev.descricao ?? null,
        ativo: true,
        data_confirmada: confirmar,
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
        slug_marco: slug,
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
