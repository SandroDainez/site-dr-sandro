export type Especialidade = "anestesiologia" | "terapia_intensiva" | "emergencias";

// ── Helpers gerais ────────────────────────────────────────────────────────────
export function getSemanaAtual(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

export function verificarCronSecret(request: Request): boolean {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export const ESPECIALIDADE_LABELS: Record<string, string> = {
  anestesiologia: "Anestesiologia",
  terapia_intensiva: "Terapia Intensiva",
  emergencias: "Emergências",
};

// ── CAMADA 1: PubMed MeSH queries ─────────────────────────────────────────────
export const MESH_QUERIES: Record<string, string> = {
  anestesiologia:
    '(Anesthesia[MeSH] OR Anesthetics[MeSH] OR "Regional Anesthesia"[MeSH] OR "Pain Management"[MeSH] OR "Anesthesia, General"[MeSH] OR "Anesthesia, Spinal"[MeSH])',
  terapia_intensiva:
    '("Critical Care"[MeSH] OR "Intensive Care Units"[MeSH] OR Sepsis[MeSH] OR "Respiration, Artificial"[MeSH] OR "Shock, Septic"[MeSH] OR "Multiple Organ Failure"[MeSH])',
  emergencias:
    '("Emergency Medicine"[MeSH] OR Resuscitation[MeSH] OR Shock[MeSH] OR "Wounds and Injuries"[MeSH] OR "Cardiopulmonary Resuscitation"[MeSH] OR "Triage"[MeSH])',
};

// ── CAMADA 2: RSS feeds — journals especializados por área ────────────────────
export const RSS_FEEDS: Record<string, { nome: string; url: string }[]> = {
  anestesiologia: [
    { nome: "Anesthesiology (ASA)", url: "https://pubs.asahq.org/anesthesiology/rss/site_1/32.xml" },
    { nome: "British Journal of Anaesthesia", url: "https://www.bjanaesthesia.org/action/showFeed?type=etoc&feed=rss&jc=bja" },
    { nome: "Anesthesia & Analgesia", url: "https://feeds.lww.com/anesthesia-analgesia/rss/ArticlesaheadofPrint" },
    { nome: "Regional Anesthesia & Pain Med", url: "https://rapm.bmj.com/rss/recent.xml" },
    { nome: "Acta Anaesthesiologica Scand", url: "https://onlinelibrary.wiley.com/feed/13996576/most-recent" },
    { nome: "Pediatric Anesthesia", url: "https://onlinelibrary.wiley.com/feed/14609592/most-recent" },
    { nome: "Journal of Clinical Anesthesia", url: "https://www.jcafullforum.com/action/showFeed?type=etoc&feed=rss&jc=jca" },
    { nome: "Anaesthesia (AAGBI)", url: "https://onlinelibrary.wiley.com/feed/13652044/most-recent" },
    { nome: "medRxiv — Anestesia (preprints)", url: "https://connect.medrxiv.org/medrxiv_xml.php?subject=anesthesia" },
  ],
  terapia_intensiva: [
    { nome: "Intensive Care Medicine (ESICM)", url: "https://link.springer.com/search.rss?query=&search-within=Journal&facet-journal-id=134" },
    { nome: "Critical Care Medicine (SCCM)", url: "https://feeds.lww.com/ccmjournal/rss/ArticlesaheadofPrint" },
    { nome: "Critical Care (BMC)", url: "https://ccforum.biomedcentral.com/articles/most-recent/rss.xml" },
    { nome: "AJRCCM (ATS)", url: "https://www.atsjournals.org/action/showFeed?type=etoc&feed=rss&jc=ajrccm" },
    { nome: "Chest", url: "https://journal.chestnet.org/action/showFeed?type=etoc&feed=rss&jc=chest" },
    { nome: "Journal of Critical Care", url: "https://www.jccjournal.org/action/showFeed?type=etoc&feed=rss&jc=yjcrc" },
    { nome: "Annals of Intensive Care", url: "https://annalsofintensivecare.springeropen.com/articles/most-recent/rss.xml" },
    { nome: "Lancet Respiratory Medicine", url: "https://www.thelancet.com/action/showFeed?type=etoc&feed=rss&jc=lanres" },
    { nome: "medRxiv — Terapia Intensiva (preprints)", url: "https://connect.medrxiv.org/medrxiv_xml.php?subject=intensive_care_and_critical_care_medicine" },
  ],
  emergencias: [
    { nome: "Annals of Emergency Medicine", url: "https://www.annemergmed.com/action/showFeed?type=etoc&feed=rss&jc=ymem" },
    { nome: "Emergency Medicine Journal", url: "https://emj.bmj.com/rss/recent.xml" },
    { nome: "Resuscitation (ERC)", url: "https://www.resuscitationjournal.com/action/showFeed?type=etoc&feed=rss&jc=resus" },
    { nome: "Academic Emergency Medicine", url: "https://onlinelibrary.wiley.com/feed/15532712/most-recent" },
    { nome: "Prehospital Emergency Care", url: "https://www.tandfonline.com/feed/rss/ipec20" },
    { nome: "Emergency Medicine Australasia", url: "https://onlinelibrary.wiley.com/feed/17426723/most-recent" },
    { nome: "Scandinavian Journal Trauma", url: "https://sjtrem.biomedcentral.com/articles/most-recent/rss.xml" },
    { nome: "American Journal of Emergency Medicine", url: "https://www.ajemjournal.com/action/showFeed?type=etoc&feed=rss&jc=yajem" },
    { nome: "medRxiv — Emergências (preprints)", url: "https://connect.medrxiv.org/medrxiv_xml.php?subject=emergency_medicine" },
  ],
};

// RSS transversais — lidos em todas as especialidades
export const RSS_TRANSVERSAIS = [
  { nome: "NEJM", url: "https://www.nejm.org/action/showFeed?type=etoc&feed=rss&jc=nejm" },
  { nome: "The Lancet", url: "https://www.thelancet.com/action/showFeed?type=etoc&feed=rss&jc=lancet" },
  { nome: "JAMA", url: "https://jamanetwork.com/rss/site_3/67.xml" },
  { nome: "BMJ", url: "https://www.bmj.com/action/showFeed?type=etoc&feed=rss&jc=bmj" },
  { nome: "Nature Medicine", url: "https://www.nature.com/nm.rss" },
  { nome: "JAMA Network Open", url: "https://jamanetwork.com/rss/site_3/174.xml" },
  { nome: "Lancet Regional Health Americas", url: "https://www.thelancet.com/action/showFeed?type=etoc&feed=rss&jc=lanam" },
  { nome: "Cochrane Library", url: "https://www.cochranelibrary.com/feed/doi/10.1002/14651858" },
  { nome: "Annals Internal Medicine", url: "https://www.acpjournals.org/action/showFeed?type=etoc&feed=rss&jc=aim" },
];

// ── CAMADA 3: Sites das sociedades — web search por especialidade ─────────────
export const SITES_SOCIEDADES: Record<string, { sigla: string; site: string }[]> = {
  anestesiologia: [
    { sigla: "ASA", site: "asahq.org" },
    { sigla: "SBA", site: "sba.com.br" },
    { sigla: "ESA", site: "euroanaesthesia.org" },
    { sigla: "WFSA", site: "wfsahq.org" },
    { sigla: "ESRA", site: "esraeurope.org" },
    { sigla: "ANZCA", site: "anzca.edu.au" },
    { sigla: "SBARD", site: "sbard.org.br" },
  ],
  terapia_intensiva: [
    { sigla: "AMIB", site: "amib.org.br" },
    { sigla: "ESICM", site: "esicm.org" },
    { sigla: "SCCM", site: "sccm.org" },
    { sigla: "ANZICS", site: "anzics.com.au" },
    { sigla: "Surviving Sepsis", site: "survivingsepsis.org" },
    { sigla: "ISICEM", site: "isicem.org" },
  ],
  emergencias: [
    { sigla: "SBMU", site: "sbmu.org.br" },
    { sigla: "ACEP", site: "acep.org" },
    { sigla: "EuSEM", site: "eusem.org" },
    { sigla: "IFEM", site: "ifem.net" },
    { sigla: "SAEM", site: "saem.org" },
    { sigla: "ERC", site: "erc.edu" },
    { sigla: "RCEM", site: "rcem.ac.uk" },
  ],
};

// ── CAMADA 4: APIs de bases secundárias ───────────────────────────────────────

// LILACS / BVS — literatura latino-americana (API gratuita)
export async function buscarLILACS(especialidade: string): Promise<any[]> {
  const termos: Record<string, string> = {
    anestesiologia: "anestesia OR anestesiologia OR analgesia",
    terapia_intensiva: "terapia intensiva OR UTI OR cuidados intensivos OR sepse",
    emergencias: "emergencia OR urgencia OR ressuscitacao OR trauma",
  };
  const q = encodeURIComponent(`(${termos[especialidade]}) AND (la:pt OR la:es OR la:en)`);
  try {
    const url = `https://api.bvsalud.org/api/v1/?op=search&lang=pt&q=${q}&count=6&sort=date`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const data = await r.json();
    const docs = data.docs ?? data.results ?? [];
    return docs.slice(0, 6).map((d: any) => ({
      origem: "lilacs",
      titulo: d.ti_es || d.ti_pt || d.ti || d.title || "",
      journal: d.ta || d.journal || "LILACS/BVS",
      url: d.ur ? `https://pesquisa.bvsalud.org/portal/resource/pt/${d.ur}` : "https://pesquisa.bvsalud.org",
      ano: d.dp?.substring(0, 4) || "",
    })).filter((d: any) => d.titulo);
  } catch {
    return [];
  }
}

// SciELO Brasil (API gratuita)
export async function buscarSciELO(especialidade: string): Promise<any[]> {
  const termos: Record<string, string> = {
    anestesiologia: "anestesia anestesiologia",
    terapia_intensiva: "terapia intensiva UTI cuidados intensivos",
    emergencias: "emergencia urgencia ressuscitacao",
  };
  const q = encodeURIComponent(termos[especialidade]);
  try {
    const url = `https://search.scielo.org/api/v1/article/?q=${q}&lang=pt&count=5&from=0&output=json&database=scl&filter%5Bpublication_year%5D%5B%5D=${new Date().getFullYear()}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const data = await r.json();
    const hits = data.hits?.hits ?? [];
    return hits.slice(0, 5).map((h: any) => {
      const src = h._source ?? {};
      return {
        origem: "scielo",
        titulo: src.title?.["pt"] || src.title?.["en"] || src.title || "",
        journal: src.journal_title || "SciELO",
        url: src.url || `https://search.scielo.org/?q=${q}`,
        ano: src.publication_year?.toString() || "",
      };
    }).filter((d: any) => d.titulo);
  } catch {
    return [];
  }
}

// OpenAlex — base aberta com 250M+ artigos (API gratuita, sem key)
export async function buscarOpenAlex(especialidade: string): Promise<any[]> {
  const conceitos: Record<string, string> = {
    anestesiologia: "C121332964", // Anesthesiology
    terapia_intensiva: "C189719430", // Intensive care medicine
    emergencias: "C2779055540", // Emergency medicine
  };
  const conceptId = conceitos[especialidade];
  const from = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
  try {
    const url = `https://api.openalex.org/works?filter=concepts.id:${conceptId},from_publication_date:${from},is_oa:true&sort=publication_date:desc&per-page=6&mailto=contato@sitedrsandro.com.br`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.results ?? []).slice(0, 6).map((w: any) => ({
      origem: "openalex",
      titulo: w.title || "",
      journal: w.primary_location?.source?.display_name || "OpenAlex",
      url: w.primary_location?.landing_page_url || w.doi || `https://openalex.org/${w.id}`,
      doi: w.doi?.replace("https://doi.org/", "") || null,
      ano: w.publication_year?.toString() || "",
    })).filter((d: any) => d.titulo);
  } catch {
    return [];
  }
}

// ClinicalTrials.gov — trials concluídos recentemente relevantes
export async function buscarClinicalTrials(especialidade: string): Promise<any[]> {
  const termos: Record<string, string> = {
    anestesiologia: "anesthesia OR analgesia OR regional anesthesia",
    terapia_intensiva: "critical care OR sepsis OR mechanical ventilation OR ICU",
    emergencias: "emergency medicine OR resuscitation OR trauma OR shock",
  };
  const q = encodeURIComponent(termos[especialidade]);
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${q}&filter.overallStatus=COMPLETED&filter.lastUpdatePostDate.gte=${new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]}&fields=NCTId,BriefTitle,OfficialTitle,BriefSummary,LeadSponsorName&pageSize=4&format=json`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.studies ?? []).slice(0, 4).map((s: any) => {
      const p = s.protocolSection;
      const id = p?.identificationModule?.nctId;
      return {
        origem: "clinicaltrials",
        titulo: p?.identificationModule?.briefTitle || "",
        journal: `ClinicalTrials.gov — ${p?.sponsorCollaboratorsModule?.leadSponsor?.name || ""}`,
        url: id ? `https://clinicaltrials.gov/study/${id}` : "https://clinicaltrials.gov",
        ano: new Date().getFullYear().toString(),
      };
    }).filter((d: any) => d.titulo);
  } catch {
    return [];
  }
}

// FDA — alertas de segurança (crítico para anestesia/UTI)
export async function buscarFDA(): Promise<any[]> {
  try {
    const url2 = `https://api.fda.gov/drug/enforcement.json?search=product_description:(anesthesia+OR+sedation+OR+vasopressor+OR+analgesic)&limit=3`;
    const r2 = await fetch(url2, { signal: AbortSignal.timeout(10000) });
    if (!r2.ok) return [];
    const data2 = await r2.json();
    return (data2.results ?? []).slice(0, 3).map((item: any) => ({
      origem: "fda",
      titulo: `FDA Alert: ${item.product_description?.substring(0, 100) || "Drug Safety Alert"}`,
      journal: "FDA MedWatch",
      url: "https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program",
      ano: new Date().getFullYear().toString(),
      tipo: "alerta_seguranca",
    })).filter((d: any) => d.titulo);
  } catch {
    return [];
  }
}

// NICE Guidelines — guidelines britânicos
export async function buscarNICE(especialidade: string): Promise<any[]> {
  const termos: Record<string, string> = {
    anestesiologia: "anaesthesia analgesia pain",
    terapia_intensiva: "critical care intensive sepsis",
    emergencias: "emergency trauma resuscitation",
  };
  try {
    const q = encodeURIComponent(termos[especialidade]);
    const url = `https://api.nice.org.uk/services/guidance/guidance-metadata?q=${q}&size=4&from=0`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const data = await r.json();
    const items = data?.embedded?.guidance ?? data?.results ?? [];
    return items.slice(0, 4).map((g: any) => ({
      origem: "nice",
      titulo: g.title || g.name || "",
      journal: `NICE ${g.type || "Guideline"}`,
      url: g.url ? `https://www.nice.org.uk${g.url}` : "https://www.nice.org.uk/guidance",
      ano: g.lastUpdated?.substring(0, 4) || new Date().getFullYear().toString(),
      tipo: "guideline",
    })).filter((d: any) => d.titulo);
  } catch {
    return [];
  }
}

// WHO Guidelines — documentos normativos globais
export async function buscarWHO(especialidade: string): Promise<any[]> {
  const termos: Record<string, string> = {
    anestesiologia: "anaesthesia surgical care pain",
    terapia_intensiva: "critical care sepsis intensive care",
    emergencias: "emergency care trauma resuscitation",
  };
  try {
    const q = encodeURIComponent(termos[especialidade]);
    const url = `https://www.who.int/api/news/list?sf_culture=en&$filter=contains(TypeNomenclature%2C'publication')&$search=${q}&$top=4`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const data = await r.json();
    const items = data?.value ?? data?.items ?? [];
    return items.slice(0, 3).map((item: any) => ({
      origem: "who",
      titulo: item.Title || item.title || "",
      journal: "WHO / Organização Mundial da Saúde",
      url: item.Url ? `https://www.who.int${item.Url}` : "https://www.who.int/publications",
      ano: item.PublicationDate?.substring(0, 4) || new Date().getFullYear().toString(),
      tipo: "guideline",
    })).filter((d: any) => d.titulo);
  } catch {
    return [];
  }
}

// ── CAMADA 5: Regulatórios brasileiros + segurança — web search ───────────────
export const SITES_REGULATORIOS_BR = [
  { sigla: "ANVISA", site: "anvisa.gov.br", foco: "alertas de segurança, resoluções RDC, notas técnicas sobre medicamentos e dispositivos médicos" },
  { sigla: "CFM", site: "cfm.org.br", foco: "resoluções, pareceres e normas éticas relevantes para anestesiologia e terapia intensiva" },
  { sigla: "CONITEC", site: "conitec.gov.br", foco: "novos PCDT (Protocolos Clínicos e Diretrizes Terapêuticas) e avaliações de tecnologias em saúde" },
  { sigla: "MS", site: "saude.gov.br", foco: "notas técnicas, portarias e campanhas de vigilância epidemiológica com impacto clínico" },
  { sigla: "ISMP-BR", site: "ismp-brasil.org", foco: "boletins de segurança de medicamentos, erros de medicação, alertas de high-alert medications" },
];

export const SITES_SEGURANCA_PACIENTE = [
  { sigla: "AHRQ", site: "ahrq.gov", foco: "patient safety reports, quality indicators e evidence-based guidelines" },
  { sigla: "Joint Commission", site: "jointcommission.org", foco: "Sentinel Event Alerts e National Patient Safety Goals" },
  { sigla: "WHO Patient Safety", site: "who.int/teams/integrated-health-services/patient-safety", foco: "global patient safety challenges e safety solutions" },
  { sigla: "SENSAR", site: "sensar.es", foco: "incidentes de segurança em anestesiologia — rede ibero-americana" },
  { sigla: "EMA", site: "ema.europa.eu", foco: "alertas de segurança de medicamentos, recomendações do PRAC e referrals regulatórios europeus" },
  { sigla: "Health Canada", site: "recalls-rappels.canada.ca", foco: "recalls e alertas de segurança de medicamentos e dispositivos" },
];

// ── Fontes de eventos para o agente de calendário ─────────────────────────────
export const FONTES_EVENTOS_COMPLETAS = `
BRASIL — Anestesiologia (PRIORIDADE):
- Congresso Brasileiro de Anestesiologia (CBA) — SBA (sba.com.br), geralmente em novembro
- Congresso Paulista de Anestesiologia (COPA / "Paulista") — SAESP (saesp.org.br), geralmente em abril
- Jornadas e congressos regionais da SBA (sul, nordeste, etc.) e das regionais (SAERJ, SAEMG, etc.)
- SBARD — Sociedade Brasileira de Anestesia Regional e Dor

BRASIL — Terapia Intensiva (PRIORIDADE):
- Congresso Brasileiro de Medicina Intensiva (CBMI) — AMIB (amib.org.br)
- CBMI Pediátrico, fóruns e congressos regionais da AMIB

BRASIL — Emergências (PRIORIDADE):
- Congresso Brasileiro de Medicina de Emergência (SBMU, sbmu.org.br)
- Congresso Brasileiro de Medicina de Urgência e Emergência (ABRAMEDE, abramede.com.br)

AMÉRICA LATINA:
- CLASA — Confederación Latinoamericana de Sociedades de Anestesiología
- Congressos das sociedades nacionais (Argentina AAARBA, México, Chile, Colômbia SCARE)

INTERNACIONAL — Anestesiologia:
- ASA Annual Meeting (asahq.org) · Euroanaesthesia/ESAIC (esaic.org) · ESRA Congress (esraeurope.org)
- WFSA World Congress (wfsahq.org) · ANZCA ASM (anzca.edu.au)

INTERNACIONAL — Terapia Intensiva:
- ESICM LIVES (esicm.org) · SCCM Critical Care Congress (sccm.org) · ISICEM Brussels (isicem.org) · ANZICS ASM

INTERNACIONAL — Emergências:
- ACEP Scientific Assembly (acep.org) · EuSEM Congress (eusem.org) · ICEM (ifem.net) · ERC Resuscitation (erc.edu) · SAEM (saem.org)
`;
