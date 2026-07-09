import type { Source } from "../types";

// Prompt da CORREÇÃO ("Aplicar correções da IA") do Comparador de Guidelines. Recebe as
// afirmações (posições de fonte) cuja citação NÃO foi validada e tenta reancorá-las num
// trecho verbatim da EVIDÊNCIA recuperada — ou ajustar o texto pra bater — ou marcar
// honestamente como sem fonte. O CÓDIGO revalida depois (âncora inventada não cola), então
// este prompt não tem como "trapacear". Espelha prompts/correcao-protocolos.ts; aqui as
// "fontes" são as evidências buscadas (biblioteca interna + PubMed), não coladas pelo médico.

export const CORRECAO_COMPARADOR_PROMPT_VERSION = "1.0.0";

export type ItemCorrigir = { id: string; secao: string; texto: string; tipo: string };

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildCorrecaoComparadorPrompt(args: { itens: ItemCorrigir[]; sources: Source[] }): string {
  const { itens, sources } = args;
  return `Você corrige as CITAÇÕES de afirmações de uma comparação entre diretrizes médicas. Cada
afirmação abaixo é a posição atribuída a uma fonte sobre um aspecto de comparação, e teve a
citação REPROVADA (a âncora não foi encontrada literalmente no texto da fonte). Para CADA item,
faça UMA opção, nesta ordem de preferência:

(1) Se alguma EVIDÊNCIA sustenta a posição COMO ESTÁ: devolva o source_id e uma âncora que é um
    trecho copiado LITERALMENTE (verbatim, ≥6 palavras contíguas, achável com Ctrl+F) do texto
    daquela evidência. Mantenha o "texto" igual.
(2) Se uma EVIDÊNCIA sustenta algo PRÓXIMO mas a posição está imprecisa: AJUSTE o "texto" para
    refletir fielmente o que a evidência diz, e ancore com o trecho verbatim correspondente.
(3) Se NENHUMA evidência sustenta a posição: source_id=null, ancora=null, tipo="geral". NÃO
    invente âncora nem force citação — honestidade acima de tudo.

REGRAS: a âncora é SEMPRE um trecho existente, palavra por palavra, no texto da evidência citada
(mesma grafia, números e pontuação). Nunca use o próprio texto da afirmação como âncora se ele
não estiver literalmente na evidência. Não troque a fonte a que a posição foi atribuída por
outra, a menos que nenhuma evidência sustente a posição original.

EVIDÊNCIAS RECUPERADAS:
${sourcesToText(sources)}

AFIRMAÇÕES A CORRIGIR (devolva uma correção para cada "id"):
${itens.map((i) => `{"id":"${i.id}","secao":"${i.secao}","tipo":"${i.tipo}","texto":${JSON.stringify(i.texto)}}`).join("\n")}

Retorne APENAS JSON:
{"correcoes":[{"id":"<id recebido>","texto":"<texto igual ou ajustado>","source_id":"<id da evidência ou null>","ancora":"<trecho verbatim da evidência ou null>","tipo":"clinica|dose|geral"}]}`;
}
