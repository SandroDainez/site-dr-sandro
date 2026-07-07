import type { Source, SecaoGerada } from "../types";

// Prompt do ESTÁGIO 2 (revisão, GPT-4o) do Arquiteto de Protocolos. Versionado.
// A revisão só APONTA problemas (issues) com sugestão concreta — NÃO reescreve o documento.
// v3: entrada ENXUTA para caber no TPM da conta (30k/min no gpt-4o). NÃO manda o texto
//     completo das fontes (a validação de âncora é feita pelo CÓDIGO, não pelo GPT-4o) nem
//     as âncoras verbatim do protocolo — só os TEXTOS das afirmações + a lista de fontes.
// v2: removido o "corrigido" (reescrita do doc inteiro) — estourava o teto de saída.

export const REVISAO_PROTOCOLOS_PROMPT_VERSION = "3.0.0";

// Lista compacta das fontes (id + título + tipo) — SEM o texto, que é o que inflava o pedido.
function fontesLista(sources: Source[]): string {
  if (!sources.length) return "(nenhuma)";
  return sources.map((s) => `[${s.id}] ${s.titulo}${s.tipo ? ` (${s.tipo})` : ""}`).join("\n");
}

// Protocolo em forma compacta: por seção, só os TEXTOS das afirmações (sem âncora/source_id,
// que a revisão não precisa reconferir). É a maior economia de tokens da entrada.
function protocoloCompacto(secoes: SecaoGerada[]): string {
  return secoes
    .map((s) => `## ${s.secao}\n` + (s.afirmacoes ?? []).map((a) => `- ${a.texto}`).join("\n"))
    .join("\n\n");
}

export function buildRevisaoProtocolosPrompt(args: { secoes: SecaoGerada[]; sources: Source[] }): string {
  const { secoes, sources } = args;
  return `Você é um REVISOR SÊNIOR (nível editor de revista médica) de um protocolo clínico institucional.
Recebe o protocolo e a lista de fontes usadas. Seu trabalho é APONTAR problemas com sugestão
concreta — NÃO reescreva o documento (a correção é aplicada manualmente).

VERIFIQUE (a validação de citação/âncora contra o texto das fontes JÁ é feita por código — não reconfira):
1. Consistência entre as seções: contradições, repetições, ordem ilógica, lacunas importantes.
2. Doses/medicamentos clinicamente plausíveis (número, unidade, via, intervalo) — sinalize o que parecer suspeito.
3. Afirmações vagas, genéricas ou clinicamente questionáveis — sinalize com sugestão de melhoria.
4. Clareza e acionabilidade à beira-leito (critérios objetivos, cortes numéricos onde couber).
Não proponha inventar conteúdo: se algo não tem respaldo, a correção é marcar como incerto, não preencher.

FONTES USADAS:
${fontesLista(sources)}

PROTOCOLO:
${protocoloCompacto(secoes)}

Liste no máximo os ~25 apontamentos mais relevantes (priorize alta severidade). Retorne APENAS JSON:
{"issues":[{"ref":"<seção ou trecho>","tipo":"citacao_invalida|sem_fonte|impreciso|dose_suspeita|estilo","severidade":"alta|media|baixa","descricao":"<o que está errado>","sugestao":"<como corrigir>"}]}`;
}
