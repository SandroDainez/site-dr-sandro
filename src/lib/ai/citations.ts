import type { Afirmacao, SecaoGerada, Source } from "./types";

// Validação DETERMINÍSTICA de citações e cálculo do confidence PELO CÓDIGO
// (não auto-reportado pela IA). Ver docs/ARQUITETURA-IA.md §4.

export function normalizar(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // tira acentos
    .replace(/\s+/g, " ")
    .trim();
}

export type StatusCitacao = "valida" | "sem_fonte" | "fonte_inexistente" | "ancora_invalida";

export type ItemValidado = {
  secao: string;
  texto: string;
  tipo: Afirmacao["tipo"];
  source_id: string | null;
  status: StatusCitacao;
  exigeFonte: boolean;
};

export type Validacao = {
  itens: ItemValidado[];
  totalClinicas: number;   // afirmações que EXIGEM fonte (clinica|dose)
  validadas: number;       // dessas, com citação válida
  semFonte: number;        // clínicas sem source_id
  invalidas: number;       // clínicas com fonte inexistente ou âncora fabricada
  confidence: number;      // 0..1
  method: string;
};

function exigeFonte(a: Afirmacao): boolean {
  return a.tipo === "clinica" || a.tipo === "dose";
}

function statusDe(a: Afirmacao, mapaSources: Map<string, string>): StatusCitacao {
  if (!a.source_id) return "sem_fonte";
  const textoNorm = mapaSources.get(a.source_id);
  if (textoNorm === undefined) return "fonte_inexistente"; // source_id não existe
  const ancora = normalizar(a.ancora ?? "");
  if (!ancora || !textoNorm.includes(ancora)) return "ancora_invalida"; // âncora não consta no source
  return "valida";
}

export function validarSecoes(secoes: SecaoGerada[], sources: Source[]): Validacao {
  const mapaSources = new Map(sources.map((s) => [s.id, normalizar(s.texto)]));
  const itens: ItemValidado[] = [];
  let totalClinicas = 0, validadas = 0, semFonte = 0, invalidas = 0;

  for (const sec of secoes) {
    for (const a of sec.afirmacoes ?? []) {
      const status = statusDe(a, mapaSources);
      const ef = exigeFonte(a);
      itens.push({ secao: sec.secao, texto: a.texto, tipo: a.tipo, source_id: a.source_id, status, exigeFonte: ef });
      if (ef) {
        totalClinicas += 1;
        if (status === "valida") validadas += 1;
        else if (status === "sem_fonte") semFonte += 1;
        else invalidas += 1; // fonte_inexistente | ancora_invalida
      }
    }
  }

  const confidence = totalClinicas === 0 ? 1 : validadas / totalClinicas;
  const method =
    "determinístico: proporção de afirmações clínicas (clinica|dose) cuja citação foi VALIDADA " +
    "= source_id existe entre os sources E a âncora (trecho verbatim) consta no texto do source " +
    "(normalizado). Sem fonte / fonte inexistente / âncora fabricada NÃO contam como validadas.";

  return {
    itens,
    totalClinicas,
    validadas,
    semFonte,
    invalidas,
    confidence: Math.round(confidence * 1000) / 1000,
    method,
  };
}

// Consolida a validação de vários blocos numa só (para o confidence GLOBAL do protocolo).
export function consolidarValidacao(secoes: SecaoGerada[], sources: Source[]): Validacao {
  return validarSecoes(secoes, sources);
}
