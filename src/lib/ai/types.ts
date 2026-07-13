// Contratos da camada de IA (ver docs/ARQUITETURA-IA.md). Os módulos falam com a
// interface AIProvider — trocar/plugar modelo não toca no módulo. Piloto: MockProvider.

// Uma fonte fornecida (texto REAL contra o qual as citações são verificadas).
export type Source = {
  id: string;        // source_id estável (ex.: "S1", "PMID123", "INT4")
  titulo: string;
  tipo: string;      // guideline | artigo | livro | consenso | biblioteca | pubmed
  autor?: string;
  ano?: number | null;
  texto: string;
  url?: string;      // origem (kb_referencias.fonte_url ou link do PubMed), quando houver
};

// Cada afirmação da saída fica ligada a um source + âncora (§4 da arquitetura).
export type Afirmacao = {
  texto: string;
  source_id: string | null;   // null = "sem fonte"
  ancora: string | null;      // trecho verbatim do source que sustenta (null se sem fonte)
  tipo: "clinica" | "dose" | "geral"; // clinica/dose EXIGEM fonte
  conferido?: boolean;        // validação MANUAL do médico ("conferi na fonte") — resolve o
                              // aviso sem citação verbatim; contado à parte da confiança automática
};

export type SecaoGerada = {
  secao: string;
  afirmacoes: Afirmacao[];
};

export type Usage = { tokensIn: number; tokensOut: number };

export type GenerateInput = {
  modulo: string;
  especialidade?: string;
  sources: Source[];
  secoesAlvo: string[];            // seções DESTE bloco
  secoesAnteriores: SecaoGerada[]; // seções já geradas (contexto)
  prompt?: string;                 // prompt montado (usado pelos providers reais; mock ignora)
  model?: string;
  temperature?: number;            // default 0.2 (providers reais)
  maxTokens?: number;              // default 3500 (providers reais)
};

export type GenerateResult = {
  provider: string;
  model: string;
  secoes: SecaoGerada[];
  usage: Usage;
};

// ── Estágio de revisão (interface completa; não usado no piloto/mock) ────────
export type Issue = {
  ref: string;
  tipo: "citacao_invalida" | "sem_fonte" | "impreciso" | "dose_suspeita" | "estilo";
  severidade: "alta" | "media" | "baixa";
  descricao: string;
  sugestao?: string;
};

export type ReviewInput = { modulo: string; draft: GenerateResult; sources: Source[]; titulo?: string };
export type ReviewResult = {
  provider: string;
  model: string;
  issues: Issue[];
  corrigido: GenerateResult;
  confidence: number;
  usage: Usage;
};

export interface AIProvider {
  readonly nome: string;
  generate(input: GenerateInput): Promise<GenerateResult>;
  review(input: ReviewInput): Promise<ReviewResult>;
}
