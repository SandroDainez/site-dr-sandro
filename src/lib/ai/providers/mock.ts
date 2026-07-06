import type { AIProvider, GenerateInput, GenerateResult, ReviewInput, ReviewResult, SecaoGerada, Afirmacao, Source } from "../types";

// MockProvider — pilota o fluxo SEM API. Gera saída realista e DETERMINÍSTICA por
// seção, com citações VÁLIDAS (âncora = trecho real do source) e afirmações plantadas
// "sem fonte" + uma citação inválida de propósito, para exercitar o cálculo de
// confidence (ver src/lib/ai/citations.ts). Ver docs/ARQUITETURA-IA.md §1.2.

// Pega um trecho VERBATIM real do texto do source (para a âncora validar).
function trecho(s: Source, i: number): string {
  const limpo = (s.texto || "").replace(/\s+/g, " ").trim();
  if (!limpo) return "";
  const frases = limpo.split(/(?<=[.;])\s/).filter((f) => f.length > 12);
  const base = frases.length ? frases[i % frases.length] : limpo;
  return base.slice(0, 90);
}

function afirmacoesDaSecao(secao: string, idx: number, sources: Source[]): Afirmacao[] {
  const out: Afirmacao[] = [];
  const semSource = sources.length === 0;
  const src = semSource ? null : sources[idx % sources.length];

  // Seções sem carga clínica → tipo "geral" (não exigem fonte).
  const gerais = ["Título", "Fluxograma", "Checklist"];
  if (gerais.includes(secao)) {
    out.push({ texto: `[${secao}] — conteúdo estrutural do protocolo (mock).`, source_id: null, ancora: null, tipo: "geral" });
    return out;
  }

  if (secao === "Referências") {
    // Lista os sources como referências (tipo geral; cita o próprio source).
    for (const s of sources) {
      out.push({ texto: `${s.autor ?? "Autor"}${s.ano ? ` (${s.ano})` : ""}. ${s.titulo}.`, source_id: s.id, ancora: trecho(s, 0), tipo: "geral" });
    }
    if (!sources.length) out.push({ texto: "Sem referências (nenhum source fornecido).", source_id: null, ancora: null, tipo: "geral" });
    return out;
  }

  // Afirmação clínica principal — citação VÁLIDA (âncora real do source).
  const tipo: Afirmacao["tipo"] = secao === "Doses e medicamentos" ? "dose" : "clinica";
  if (src) {
    out.push({
      texto: `${secao}: conduta fundamentada no material fornecido (mock).`,
      source_id: src.id,
      ancora: trecho(src, idx),
      tipo,
    });
  } else {
    // Sem sources → clínica obrigatoriamente "sem fonte".
    out.push({ texto: `${secao}: sem material de origem (mock).`, source_id: null, ancora: null, tipo });
  }

  // PLANTADO: a cada 3 seções, uma afirmação clínica "sem fonte".
  if (src && idx % 3 === 0) {
    out.push({ texto: `${secao}: observação adicional sem respaldo nos sources (mock).`, source_id: null, ancora: null, tipo: "clinica" });
  }

  // PLANTADO: no "Diagnóstico diferencial", uma citação INVÁLIDA (âncora inexistente).
  if (src && secao === "Diagnóstico diferencial") {
    out.push({ texto: `${secao}: afirmação com âncora fabricada (mock).`, source_id: src.id, ancora: "TRECHO_INEXISTENTE_NO_SOURCE_123", tipo: "clinica" });
  }

  return out;
}

export class MockProvider implements AIProvider {
  readonly nome = "mock";

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const secoes: SecaoGerada[] = input.secoesAlvo.map((secao) => {
      const idxGlobal = input.secoesAnteriores.length + input.secoesAlvo.indexOf(secao);
      return { secao, afirmacoes: afirmacoesDaSecao(secao, idxGlobal, input.sources) };
    });
    const outLen = JSON.stringify(secoes).length;
    const inLen = (input.prompt?.length ?? 0) + input.sources.reduce((n, s) => n + s.texto.length, 0);
    return {
      provider: this.nome,
      model: "mock-1",
      secoes,
      usage: { tokensIn: Math.ceil(inLen / 4), tokensOut: Math.ceil(outLen / 4) },
    };
  }

  // Estágio de revisão não é exercido no piloto (Comando 7.5). Stub de interface.
  async review(input: ReviewInput): Promise<ReviewResult> {
    return {
      provider: this.nome,
      model: "mock-1",
      issues: [],
      corrigido: input.draft,
      confidence: 1,
      usage: { tokensIn: 0, tokensOut: 0 },
    };
  }
}
