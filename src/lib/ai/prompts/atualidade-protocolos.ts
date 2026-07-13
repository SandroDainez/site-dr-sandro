import type { SecaoGerada } from "../types";

// Prompt do "Checar atualidade" do Arquiteto de Protocolos. Recebe o protocolo atual + uma
// lista de FONTES RECENTES (abstracts do PubMed, priorizando diretrizes/metanálises/ensaios
// recentes) e aponta as afirmações que estão DESATUALIZADAS/CONTRADITAS pela evidência atual —
// com a fonte (pmid) e o que se recomenda AGORA. Não reescreve, não inventa: só aponta.

export const ATUALIDADE_PROTOCOLOS_PROMPT_VERSION = "1.0.0";

export type FonteRecente = { pmid: string; titulo: string; ano: string; resumo: string };

function protocoloCompacto(secoes: SecaoGerada[]): string {
  return secoes.map((s) => `## ${s.secao}\n${(s.afirmacoes ?? []).map((a) => `- ${a.texto}`).join("\n")}`).join("\n\n");
}
function fontesText(fontes: FonteRecente[]): string {
  return fontes.map((f) => `[${f.pmid}]${f.ano ? ` (${f.ano})` : ""} ${f.titulo}\n${f.resumo}`).join("\n\n---\n\n");
}

export function buildAtualidadeProtocolosPrompt(args: { titulo?: string; secoes: SecaoGerada[]; fontes: FonteRecente[] }): string {
  const { titulo, secoes, fontes } = args;
  return `Você é um REVISOR DE ATUALIDADE de um protocolo clínico institucional${titulo ? ` sobre "${titulo}"` : ""}.
Recebe o PROTOCOLO ATUAL e uma lista de FONTES RECENTES (abstracts do PubMed, priorizando
diretrizes, metanálises e ensaios recentes). Encontre afirmações do protocolo que estejam
DESATUALIZADAS ou CONTRADITAS pela evidência recente: droga de 1ª linha que mudou, dose, alvo/corte
revisado, indicação/conduta que a diretriz atual recomenda diferente.

REGRAS (honestidade acima de tudo):
- Só aponte quando UMA FONTE RECENTE da lista realmente trata do ponto e indica algo diferente/mais
  novo. Cite o PMID dessa fonte e o que ela recomenda AGORA. NÃO invente. Se as fontes não cobrem o
  ponto, NÃO aponte.
- NÃO aponte diferença de redação/estilo — só MUDANÇA CLÍNICA real (o que fazer, com que droga, dose,
  alvo, quando indicar).
- Se o protocolo já está de acordo com o mais recente, retorne lista VAZIA.

PROTOCOLO ATUAL:
${protocoloCompacto(secoes)}

FONTES RECENTES (evidência atual — use SÓ estas para julgar atualidade):
${fontesText(fontes)}

Retorne APENAS JSON:
{"itens":[{"secao":"<seção do protocolo>","trecho":"<afirmação que está desatualizada, curta>","problema":"<o que está superado>","recomendacao_atual":"<o que a evidência recente recomenda>","pmid":"<pmid da fonte que sustenta>"}]}`;
}
