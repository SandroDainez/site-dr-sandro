import type { Source } from "../types";

// Prompt da CORREÇÃO ("Aplicar correções da IA") do Arquiteto de Protocolos. Recebe as
// afirmações cuja citação NÃO foi validada e tenta reancorá-las num trecho verbatim da
// fonte — ou ajustar o texto pra bater — ou marcar honestamente como sem fonte. O CÓDIGO
// revalida depois (âncora inventada não cola), então este prompt não tem como "trapacear".

export const CORRECAO_PROTOCOLOS_PROMPT_VERSION = "1.1.0";

export type ItemCorrigir = { id: string; secao: string; texto: string; tipo: string };

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildCorrecaoProtocolosPrompt(args: { itens: ItemCorrigir[]; sources: Source[] }): string {
  const { itens, sources } = args;
  return `Você corrige as CITAÇÕES de afirmações de um protocolo clínico. Cada afirmação abaixo teve
a citação REPROVADA (a âncora não foi encontrada literalmente no texto da fonte). Para CADA item,
faça UMA opção, nesta ordem de preferência:

(1) Se algum SOURCE sustenta a afirmação COMO ESTÁ: devolva o source_id e uma âncora que é um
    trecho copiado LITERALMENTE (verbatim, ≥6 palavras contíguas, achável com Ctrl+F) do texto
    daquele source. Mantenha o "texto" igual.
(2) Se um SOURCE sustenta algo PRÓXIMO mas a afirmação está imprecisa: AJUSTE o "texto" para
    refletir fielmente o que o source diz, e ancore com o trecho verbatim correspondente.
(3) Se NENHUM source sustenta a afirmação: source_id=null, ancora=null, tipo="geral". NÃO invente
    âncora nem force citação — honestidade acima de tudo.

IDIOMA (crítico): alguns SOURCES são abstracts do PubMed EM INGLÊS. A âncora é um trecho copiado
palavra por palavra DO SOURCE, então ela fica NA LÍNGUA DO SOURCE — se o source é inglês, a
âncora é em INGLÊS (ex.: "levosimendan was associated with fewer arrhythmic events"). NÃO
traduza a âncora, nem tente ancorar com um trecho em português num source em inglês (nunca vai
bater). O campo "texto" da afirmação PERMANECE em português — só a âncora acompanha a fonte.

REGRAS: a âncora é SEMPRE um trecho existente, palavra por palavra, no texto do source citado
(mesma grafia, números e pontuação, no idioma do source). Nunca use o próprio texto da afirmação
como âncora se ele não estiver literalmente no source.

SOURCES:
${sourcesToText(sources)}

AFIRMAÇÕES A CORRIGIR (devolva uma correção para cada "id"):
${itens.map((i) => `{"id":"${i.id}","secao":"${i.secao}","tipo":"${i.tipo}","texto":${JSON.stringify(i.texto)}}`).join("\n")}

Retorne APENAS JSON:
{"correcoes":[{"id":"<id recebido>","texto":"<texto igual ou ajustado>","source_id":"<id do source ou null>","ancora":"<trecho verbatim do source ou null>","tipo":"clinica|dose|geral"}]}`;
}
