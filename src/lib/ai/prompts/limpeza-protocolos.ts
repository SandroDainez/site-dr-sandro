import type { SecaoGerada } from "../types";

// Prompt da LIMPEZA do Arquiteto de Protocolos. Recebe SÓ as afirmações que sobraram SEM
// âncora válida (biblioteca + PubMed já tentados). Decide, item a item, REMOVER ou MANTER,
// com o tema do protocolo travado. Régua conservadora: só remove o que é fora do tema,
// inconsistente ou factualmente questionável — preserva erros-exemplo, checklists de
// segurança e conhecimento-consenso legítimo (que são bons, só não têm "paper" pra citar).

export const LIMPEZA_PROTOCOLOS_PROMPT_VERSION = "1.0.0";

export type ItemLimpar = { id: string; secao: string; texto: string; tipo: string };

function protocoloCompacto(secoes: SecaoGerada[]): string {
  return secoes.map((s) => `## ${s.secao}\n${(s.afirmacoes ?? []).map((a) => `- ${a.texto}`).join("\n")}`).join("\n\n");
}

export function buildLimpezaProtocolosPrompt(args: { titulo?: string; secoes: SecaoGerada[]; itens: ItemLimpar[] }): string {
  const { titulo, secoes, itens } = args;
  return `Você faz a LIMPEZA final de um protocolo clínico institucional${titulo ? ` sobre "${titulo}"` : ""}.
As afirmações abaixo ficaram SEM fonte que as sustente (a biblioteca interna E o PubMed já foram
tentados e não cobriram). Para CADA uma, decida entre REMOVER ou MANTER — de forma CONSERVADORA.

REMOVER (liste o id) quando a afirmação for:
- FORA DO TEMA${titulo ? ` ("${titulo}")` : ""}: de outra doença/condição/especialidade, ou tangencial/que não caiba neste protocolo;
- INCONSISTENTE: contradiz outra parte do protocolo, ou está clinicamente incoerente;
- FACTUALMENTE QUESTIONÁVEL/IMPRECISA: um dado, número, dose ou comparação afirmado como fato sem respaldo.

MANTER (NÃO liste) quando for conteúdo LEGÍTIMO que só é difícil de citar com um trecho:
- EXEMPLO DE ERRO a evitar ("armadilha", "não faça X") — pertence ao protocolo mesmo sem paper;
- PASSO DE CHECKLIST de segurança / boa prática operacional consolidada;
- CONHECIMENTO-CONSENSO estrutural do próprio tema (definição, princípio geral aceito).

Na dúvida entre remover e manter, MANTENHA (não mutile o protocolo). Nunca remova algo só por não ter citação — remova por ser fora do tema, inconsistente ou factualmente furado.

PROTOCOLO (contexto — para julgar tema e consistência):
${protocoloCompacto(secoes)}

AFIRMAÇÕES CANDIDATAS (só estas podem ser removidas):
${itens.map((i) => `{"id":"${i.id}","secao":"${i.secao}","tipo":"${i.tipo}","texto":${JSON.stringify(i.texto)}}`).join("\n")}

Retorne APENAS JSON com as que devem SAIR:
{"remover":[{"id":"<id recebido>","motivo":"fora_do_tema|inconsistente|sem_respaldo"}]}`;
}
