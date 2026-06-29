import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { verificarCronSecret, PRINCIPIOS_AGENTE } from "@/lib/agents/utils";

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

// Lista curada de congressos-MARCO (fonte de verdade). Cada um tem uma chave estável
// (slug) usada para identidade/dedup e para a confirmação automática de data.
// chk = padrão que o TÍTULO precisa casar para a tag ser aceita (evita mis-tag, ex.:
// "Euro-Abu Dhabi" ser marcado como EuSEM). Validação feita pelo sistema, não pelo modelo.
const MARCOS: { slug: string; sigla: string; nome: string; chk: RegExp; esp: string[] }[] = [
  { slug: "cba", sigla: "CBA/SBA", nome: "Congresso Brasileiro de Anestesiologia", chk: /\bcba\b|congresso brasileiro de anestesiolog/i, esp: ["anestesiologia"] },
  { slug: "copa-saesp", sigla: "COPA/SAESP", nome: "Congresso Paulista de Anestesiologia", chk: /\bcopa\b|paulista de anestesiolog/i, esp: ["anestesiologia"] },
  { slug: "cbmi", sigla: "CBMI/AMIB", nome: "Congresso Brasileiro de Medicina Intensiva", chk: /\bcbmi\b|brasileiro de medicina intensiva/i, esp: ["terapia_intensiva"] },
  { slug: "cbmede", sigla: "CBMEDE/ABRAMEDE", nome: "Congresso Brasileiro de Medicina de Emergência", chk: /\bcbmede\b|brasileiro de medicina de emerg/i, esp: ["emergencias"] },
  { slug: "clasa", sigla: "CLASA", nome: "Congreso Latinoamericano de Anestesiología", chk: /\bclasa\b|latinoamericano de anestesiolog/i, esp: ["anestesiologia"] },
  { slug: "asa", sigla: "ASA", nome: "ASA Annual Meeting (American Society of Anesthesiologists)", chk: /\basa\b.*(annual|meeting)|american society of anesthesiolog/i, esp: ["anestesiologia"] },
  { slug: "euroanaesthesia", sigla: "ESAIC", nome: "Euroanaesthesia (ESAIC)", chk: /euroanaesthesia|euroanestesia|\besaic\b/i, esp: ["anestesiologia"] },
  { slug: "wca", sigla: "WFSA/WCA", nome: "World Congress of Anaesthesiologists", chk: /\bwca\b|world congress of anaesthesiolog/i, esp: ["anestesiologia"] },
  { slug: "esicm-lives", sigla: "ESICM", nome: "ESICM LIVES", chk: /\besicm\b/i, esp: ["terapia_intensiva"] },
  { slug: "sccm", sigla: "SCCM", nome: "SCCM Critical Care Congress", chk: /\bsccm\b|critical care congress/i, esp: ["terapia_intensiva"] },
  { slug: "isicem", sigla: "ISICEM", nome: "ISICEM (Bruxelas)", chk: /\bisicem\b/i, esp: ["terapia_intensiva", "emergencias"] },
  { slug: "acep", sigla: "ACEP", nome: "ACEP Scientific Assembly", chk: /\bacep\b/i, esp: ["emergencias"] },
  { slug: "eusem", sigla: "EuSEM", nome: "European Emergency Medicine Congress (EuSEM)", chk: /\beusem\b|european emergency medicine congress/i, esp: ["emergencias"] },
  { slug: "saem", sigla: "SAEM", nome: "SAEM Annual Meeting", chk: /\bsaem\b/i, esp: ["emergencias"] },
];
const MAPA_MARCOS = MARCOS.map((m) => `${m.sigla}→'${m.slug}'`).join(", ");

// Título normalizado (sem acento, sem ano, só letras) — base do dedup entre execuções.
function normTitulo(t: string): string {
  return (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/20\d\d/g, "").replace(/[^a-z]+/g, " ").trim();
}
function diffDias(a: string, b: string): number {
  return Math.abs((new Date(a + "T12:00:00").getTime() - new Date(b + "T12:00:00").getTime()) / 86400000);
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
  "slug_marco": "SÓ p/ congressos-marco, use a chave: ${MAPA_MARCOS}. Qualquer outro evento: omita este campo."
}

CONGRESSOS-MARCO: se achar a data OFICIAL e exata de um marco da lista acima, inclua o
"slug_marco" certo + a data real — o sistema usa a chave para identificar o evento e
confirmar automaticamente a data quando ela for verificada no site oficial.

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
  const prompt = `Você é especialista em eventos científicos médicos.\n\n${PRINCIPIOS_AGENTE}\n\n${instrucao}`;
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

// Blocklist DETERMINÍSTICA: derruba na hora eventos claramente fora do escopo
// (outras profissões ou outras especialidades médicas). Barato e à prova de erro do modelo.
const TERMOS_FORA_ESCOPO = [
  "fisioterap", "enfermag", "enfermeir", "nursing", "odontolog", "dentíst", "dentist",
  "fonoaudiol", "nutriç", "nutrición", "nutrition", "psicolog", "veterinár", "biomédic",
  "farmacêut", "farmacia", "farmacia", "auditoria", "auditor", "gestão hospitalar",
  "gestão em saúde", "administração hospitalar", "nefrolog", "cardiolog", "neurolog",
  "ginecolog", "obstetr", "ortoped", "dermatolog", "oftalmolog", "urolog", "psiquiatr",
  "radiolog", "oncolog", "endocrinolog", "reumatolog", "geriatr", "estética",
];
function foraDoEscopo(ev: any): boolean {
  const txt = `${ev.titulo || ""} ${ev.organizador || ""} ${ev.descricao || ""}`.toLowerCase();
  return TERMOS_FORA_ESCOPO.some((t) => txt.includes(t));
}

// Correção DETERMINÍSTICA da especialidade (à prova de erro do classificador LLM).
// Se o TÍTULO nomeia claramente UMA única das 3 áreas, força essa área. Quando o
// título aponta zero ou múltiplas áreas (ex.: ISICEM = intensiva+emergência), mantém
// a escolha do LLM. Conserta casos como "Congreso de Anestesiología" rotulado errado.
function corrigirEspecialidadePorTitulo(ev: any, espLLM: string[]): string[] {
  const t = `${ev.titulo || ""}`.toLowerCase();
  const hits: string[] = [];
  if (/anest|anaest/.test(t)) hits.push("anestesiologia");
  if (/intensiv|critical care/.test(t)) hits.push("terapia_intensiva");
  if (/emerg|urgênc|urgenc/.test(t)) hits.push("emergencias");
  return hits.length === 1 ? hits : espLLM;
}

// CLASSIFICADOR (passe dedicado, estrito): decide MANTER e atribui a especialidade
// CORRETA — não confia na escolha do buscador. Só anestesiologia / terapia intensiva /
// medicina de emergência PARA MÉDICOS; conservador (especialidade primária do evento).
async function classificarEventos(eventos: any[]): Promise<any[]> {
  if (eventos.length === 0) return [];
  const lista = eventos.map((e, i) => `[${i}] "${e.titulo}" | organizador: ${e.organizador || "?"} | ${e.descricao || ""}`).join("\n");
  const prompt = `Você classifica eventos científicos para um site de médicos das especialidades ANESTESIOLOGIA, TERAPIA INTENSIVA (medicina intensiva) e MEDICINA DE EMERGÊNCIA.

Para CADA evento abaixo, decida:
- "manter": true SOMENTE se o público-alvo PRIMÁRIO forem MÉDICOS dessas 3 áreas. Marque false se for primariamente de outra profissão (fisioterapia, enfermagem, farmácia, odontologia, nutrição) OU de outra especialidade médica (nefrologia, cardiologia, neurologia, auditoria/gestão médica, etc.), mesmo que tenha algum tema de UTI/emergência.
- "especialidades": atribua a área do evento de forma ESTRITA. A REGRA: a MAIORIA dos congressos pertence a UMA ÚNICA especialidade — aquela cujos médicos o consideram "o congresso deles". Só atribua DUAS quando o evento for explícita e igualmente das duas (ex.: ISICEM = terapia intensiva E emergência; congresso de neuroanestesia E neurointensivismo). Um congresso de ANESTESIOLOGIA é ["anestesiologia"] APENAS, mesmo que tenha sessões de UTI ou cite trauma (NÃO marque terapia_intensiva nem emergencias). Um congresso de MEDICINA INTENSIVA é ["terapia_intensiva"] apenas. Valores válidos: "anestesiologia", "terapia_intensiva", "emergencias".

EVENTOS:
${lista}

Retorne APENAS JSON: {"itens":[{"i":0,"manter":true,"especialidades":["anestesiologia"]}, ...]} com um item por índice.`;
  try {
    const r = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0,
      response_format: { type: "json_object" },
    });
    const data = JSON.parse(r.choices[0].message.content ?? "{}");
    const itens: any[] = Array.isArray(data.itens) ? data.itens : [];
    const porIdx = new Map<number, any>(itens.map((x) => [Number(x.i), x]));
    const validas = new Set(["anestesiologia", "terapia_intensiva", "emergencias"]);
    const out: any[] = [];
    eventos.forEach((ev, i) => {
      const c = porIdx.get(i);
      if (c && c.manter === false) return; // fora de escopo → descarta
      const esp = (c?.especialidades ?? ev.especialidades ?? []).filter((x: string) => validas.has(x));
      const base = esp.length ? esp : (ev.especialidades ?? []);
      out.push({ ...ev, especialidades: corrigirEspecialidadePorTitulo(ev, base) });
    });
    return out;
  } catch {
    return eventos; // fail-safe: mantém o que veio (blocklist já filtrou o óbvio)
  }
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
    // Exige a data como FRASE CONTÍGUA e bem-formada (dia+mês+ano juntos). Assim uma
    // página genérica que só tenha "25" e "2026" soltos NÃO confirma (sem falso-positivo).
    const padroes = [
      // pt: "25 de novembro de 2026" / "25 a 28 de novembro de 2026"
      new RegExp(`\\b${dia}\\b(?:\\s+a\\s+\\d{1,2})?\\s+de\\s+${mp}\\s+de\\s+${y}`, "i"),
      // pt (dia é o fim do intervalo): "22 a 25 de novembro de 2026"
      new RegExp(`\\b\\d{1,2}\\s+a\\s+${dia}\\s+de\\s+${mp}\\s+de\\s+${y}`, "i"),
      // en: "november 25, 2026" / "november 25-28, 2026"
      new RegExp(`${me}\\s+${dia}(?:\\s*[-–]\\s*\\d{1,2})?,?\\s+${y}`, "i"),
      // en: "25 november 2026" / "25-28 november 2026"
      new RegExp(`\\b${dia}(?:\\s*[-–]\\s*\\d{1,2})?\\s+${me}\\s+${y}`, "i"),
      // numérico e ISO
      new RegExp(`\\b${dd}/${mm}/${y}\\b`),
      new RegExp(`\\b${dia}/${mm}/${y}\\b`),
      new RegExp(dataISO.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    ];
    return padroes.some((re) => re.test(html));
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

  let eventos = await pesquisarEventos();
  // Escopo/qualidade: (1) blocklist determinística derruba fora de escopo óbvio;
  // (2) classificador estrito decide manter + corrige a especialidade (não o buscador).
  const antesEscopo = eventos.length;
  eventos = eventos.filter((ev) => !foraDoEscopo(ev));
  eventos = await classificarEventos(eventos);
  const removidosEscopo = antesEscopo - eventos.length;

  // Carrega os eventos ativos UMA vez e indexa por slug / url / título normalizado.
  // O índice em memória é a base do dedup robusto entre execuções (evita cópias por
  // pequenas variações de data ou URL que o modelo traz a cada rodada).
  const { data: existentesRaw } = await supabase
    .from("medical_events")
    .select("id,titulo,data_inicio,data_fim,data_confirmada,url_oficial,slug_marco")
    .eq("ativo", true)
    .gte("data_inicio", hoje);
  const porSlug = new Map<string, any>();
  const porUrl = new Map<string, any>();
  const porNorm = new Map<string, any[]>();
  const indexar = (r: any) => {
    if (r.slug_marco) porSlug.set(r.slug_marco, r);
    if (r.url_oficial) porUrl.set(String(r.url_oficial).trim().toLowerCase(), r);
    const k = normTitulo(r.titulo);
    if (k) { const arr = porNorm.get(k) ?? []; arr.push(r); porNorm.set(k, arr); }
  };
  (existentesRaw ?? []).forEach(indexar);

  for (const ev of eventos) {
    if (!ev.url_oficial || !ev.data_inicio || !ev.titulo) { ignorados++; continue; }
    if (ev.data_inicio < hoje || ev.data_inicio > fimJanela) { ignorados++; continue; }

    // Casa primeiro pela chave de congresso-marco (slug_marco) — assim um marco que
    // estava "a confirmar" é atualizado com a data oficial. Senão, casa por URL/título.
    // Identidade de congresso-marco derivada do TÍTULO (determinístico — não depende
    // do modelo lembrar do slug). Marco define também a especialidade canônica.
    let slug: string | null = null;
    const marco = MARCOS.find((m) => m.chk.test(ev.titulo || ""));
    if (marco) { slug = marco.slug; ev.especialidades = marco.esp; }
    // Casa em memória: slug-marco → URL exata → título normalizado + data próxima (±75d).
    let existente: any = null;
    if (slug) existente = porSlug.get(slug) ?? null;
    if (!existente) existente = porUrl.get(String(ev.url_oficial).trim().toLowerCase()) ?? null;
    if (!existente) {
      const nk = normTitulo(ev.titulo);
      const cands = porNorm.get(nk) ?? [];
      existente = cands.find((c) => diffDias(c.data_inicio, ev.data_inicio) <= 75) ?? null;
      // Fallback: título variante (um contém o outro, ex.: "X" vs "X (sigla)" vs "sigla - X")
      if (!existente && nk.length >= 12) {
        for (const [k, arr] of porNorm) {
          if (k === nk || (!k.includes(nk) && !nk.includes(k))) continue;
          const m = arr.find((c) => diffDias(c.data_inicio, ev.data_inicio) <= 75);
          if (m) { existente = m; break; }
        }
      }
    }

    if (existente) {
      // Congresso-marco AINDA não confirmado: só aceita/confirma a nova data se ela
      // REALMENTE aparecer no site oficial (evita "confirmar" data chutada pelo modelo).
      const marcoPendente = !!slug && existente.data_confirmada === false;
      let novaData = ev.data_inicio;
      let novaDataFim = ev.data_fim ?? null;
      let confirmar = true;
      if (marcoPendente) {
        // Verifica SEMPRE no site oficial canônico salvo (não na URL volátil que o
        // agente trouxe — que pode ser um agregador com data chutada).
        const verificada = await verificarDataNaFonte(existente.url_oficial, ev.data_inicio);
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
        // corrige a especialidade de linhas já existentes (classificador é a autoridade)
        ...(Array.isArray(ev.especialidades) && ev.especialidades.length ? { especialidades: ev.especialidades } : {}),
        ativo: true,
        data_confirmada: confirmar,
        // marca a linha como marco (sem sobrescrever com null se não vier chave)
        ...(slug ? { slug_marco: slug } : {}),
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
      if (error) { ignorados++; }
      else {
        inseridos++;
        // indexa o recém-inserido p/ não duplicar com uma variante na mesma rodada
        indexar({ titulo: ev.titulo, data_inicio: ev.data_inicio, url_oficial: ev.url_oficial, slug_marco: slug });
      }
    }
  }

  return NextResponse.json({
    status: "ok", inseridos, atualizados, ignorados, removidosEscopo,
    janela: { de: hoje, ate: fimJanela },
  });
}

// Vercel cron dispara via GET e injeta `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: NextRequest) {
  return POST(request);
}
