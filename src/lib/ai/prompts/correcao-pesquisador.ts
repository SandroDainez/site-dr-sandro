import type { Source } from "../types";

// Prompt da CORREÇÃO ("Aplicar correções da IA") do Pesquisador Científico. Recebe as
// afirmações cuja citação NÃO foi validada e tenta reancorá-las num trecho verbatim da
// evidência (fonte encontrada na busca — biblioteca interna ou PubMed) — ou ajustar o texto
// pra bater — ou marcar honestamente como sem fonte. O CÓDIGO revalida depois (âncora
// inventada não cola), então este prompt não tem como "trapacear". Espelha
// correcao-protocolos.ts (mesmo JSON, mesmas regras de âncora), com wording adaptado a
// síntese de pesquisa científica.

export const CORRECAO_PESQUISADOR_PROMPT_VERSION = "1.0.0";

export type ItemCorrigir = { id: string; secao: string; texto: string; tipo: string };

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildCorrecaoPesquisadorPrompt(args: { itens: ItemCorrigir[]; sources: Source[] }): string {
  const { itens, sources } = args;
  return `Você corrige as CITAÇÕES de afirmações de uma síntese de pesquisa científica. Cada
afirmação abaixo teve a citação REPROVADA (a âncora não foi encontrada literalmente no texto
da evidência). Para CADA item, faça UMA opção, nesta ordem de preferência:

(1) Se alguma EVIDÊNCIA sustenta a afirmação COMO ESTÁ: devolva o source_id e uma âncora que é
    um trecho copiado LITERALMENTE (verbatim, ≥6 palavras contíguas, achável com Ctrl+F) do
    texto daquela evidência. Mantenha o "texto" igual.
(2) Se uma EVIDÊNCIA sustenta algo PRÓXIMO mas a afirmação está imprecisa: AJUSTE o "texto" para
    refletir fielmente o que a evidência diz, e ancore com o trecho verbatim correspondente.
(3) Se NENHUMA evidência sustenta a afirmação: source_id=null, ancora=null, tipo="geral". NÃO
    invente âncora nem force citação — honestidade acima de tudo.

REGRAS: a âncora é SEMPRE um trecho existente, palavra por palavra, no texto da evidência citada
(mesma grafia, números e pontuação). Nunca use o próprio texto da afirmação como âncora se ele
não estiver literalmente na evidência.

EVIDÊNCIAS (biblioteca interna + PubMed):
${sourcesToText(sources)}

AFIRMAÇÕES A CORRIGIR (devolva uma correção para cada "id"):
${itens.map((i) => `{"id":"${i.id}","secao":"${i.secao}","tipo":"${i.tipo}","texto":${JSON.stringify(i.texto)}}`).join("\n")}

Retorne APENAS JSON:
{"correcoes":[{"id":"<id recebido>","texto":"<texto igual ou ajustado>","source_id":"<id da evidência ou null>","ancora":"<trecho verbatim da evidência ou null>","tipo":"clinica|dose|geral"}]}`;
}
