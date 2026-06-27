export type Especialidade = "anestesiologia" | "terapia_intensiva" | "emergencias";
export type Modalidade = "presencial" | "online" | "hibrido";

export type OrigemFonte =
  | "pubmed" | "rss" | "sociedade" | "regulatorio"
  | "lilacs" | "scielo" | "openalex" | "clinicaltrials"
  | "fda" | "nice" | "who" | "conitec" | "anvisa";

export interface Fonte {
  titulo: string;
  journal: string;
  pmid?: string;
  doi?: string;
  url: string;
  ano?: number;
  origem: OrigemFonte;
  tipo?: string;
}

export interface Topico {
  titulo: string;
  descricao: string;
  relevancia_clinica: string;
  pmid?: string;
  fonte_nome?: string;
  fonte_tipo?: string;
}

export interface MedicalUpdate {
  id: string;
  especialidade: Especialidade;
  titulo: string;
  resumo: string;
  topicos: Topico[];
  fontes: Fonte[];
  semana_referencia: string;
  data_publicacao: string;
  publicado: boolean;
}

export interface MedicalEvent {
  id: string;
  titulo: string;
  descricao?: string;
  especialidades: Especialidade[];
  data_inicio: string;
  data_fim?: string;
  local_nome?: string;
  cidade?: string;
  pais: string;
  modalidade?: Modalidade;
  url_oficial: string;
  organizador?: string;
  destaque: boolean;
  ativo: boolean;
}

// ── Ponte entre as áreas do site e as especialidades do agente ────────────────
// O site usa "ti"; o agente/Supabase usa "terapia_intensiva".
export type SiteArea = "emergencias" | "ti" | "anestesiologia";

export function siteAreaToEspecialidade(area: SiteArea): Especialidade {
  return area === "ti" ? "terapia_intensiva" : area;
}

export function especialidadeToSiteArea(esp: Especialidade): SiteArea {
  return esp === "terapia_intensiva" ? "ti" : esp;
}
