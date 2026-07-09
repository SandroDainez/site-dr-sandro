import type { Source } from "../types";
import type { ItemCorrigir } from "./correcao-protocolos";

// Prompt da CORREÇÃO ("Aplicar correções da IA") do Atualizador de Protocolos. Igual em
// estrutura ao correcao-protocolos.ts, mas o wording fala de ATUALIZAÇÃO DE PROTOCOLO COM
// EVIDÊNCIA RECENTE: as fontes aqui são as evidências (biblioteca interna + PubMed)
// reconstruídas do snapshot `referencias` da versão — o `Source.texto` pode vir VAZIO ao
// reabrir uma versão salva (carregarVersao só grava metadados no snapshot, não o texto
// completo da evidência). Mesmo assim usamos o texto disponível: se vazio, a âncora não vai
// bater e o item simplesmente permanece sem citação válida — o CÓDIGO revalida depois
// (citations.ts), então não há como "trapacear" preenchendo uma âncora inventada.

export const CORRECAO_ATUALIZADOR_PROMPT_VERSION = "1.0.0";

export type { ItemCorrigir };

function sourcesToText(sources: Source[]): string {
  return sources
    .map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto || "(texto não disponível nesta sessão)"}`)
    .join("\n\n---\n\n");
}

export function buildCorrecaoAtualizadorPrompt(args: { itens: ItemCorrigir[]; sources: Source[] }): string {
  const { itens, sources } = args;
  return `Você corrige as CITAÇÕES de afirmações de uma ATUALIZAÇÃO DE PROTOCOLO COM EVIDÊNCIA
RECENTE (relatório de delta: o que mudou/deve mudar no protocolo publicado, à luz de evidência
nova da biblioteca interna e do PubMed). Cada afirmação abaixo teve a citação REPROVADA (a
âncora não foi encontrada literalmente no texto da evidência). Para CADA item, faça UMA opção,
nesta ordem de preferência:

(1) Se alguma EVIDÊNCIA sustenta a afirmação COMO ESTÁ: devolva o source_id e uma âncora que é
    um trecho copiado LITERALMENTE (verbatim, ≥6 palavras contíguas, achável com Ctrl+F) do
    texto daquela evidência. Mantenha o "texto" igual.
(2) Se uma EVIDÊNCIA sustenta algo PRÓXIMO mas a afirmação está imprecisa: AJUSTE o "texto" para
    refletir fielmente o que a evidência diz, e ancore com o trecho verbatim correspondente.
(3) Se NENHUMA evidência sustenta a afirmação (inclusive quando o texto da evidência não está
    disponível nesta sessão): source_id=null, ancora=null, tipo="geral". NÃO invente âncora nem
    force citação — honestidade acima de tudo.

REGRAS: a âncora é SEMPRE um trecho existente, palavra por palavra, no texto da evidência citada
(mesma grafia, números e pontuação). Nunca use o próprio texto da afirmação como âncora se ele
não estiver literalmente na evidência. Se o texto da evidência não estiver disponível, use a
opção (3).

EVIDÊNCIAS:
${sourcesToText(sources)}

AFIRMAÇÕES A CORRIGIR (devolva uma correção para cada "id"):
${itens.map((i) => `{"id":"${i.id}","secao":"${i.secao}","tipo":"${i.tipo}","texto":${JSON.stringify(i.texto)}}`).join("\n")}

Retorne APENAS JSON:
{"correcoes":[{"id":"<id recebido>","texto":"<texto igual ou ajustado>","source_id":"<id da evidência ou null>","ancora":"<trecho verbatim da evidência ou null>","tipo":"clinica|dose|geral"}]}`;
}
