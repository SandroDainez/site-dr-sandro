import type { Source, SecaoGerada } from "../types";

// Prompt do ESTÁGIO 2 (revisão, GPT-4o) do Editor Científico. Versionado.
// A revisão APONTA problemas e produz versão corrigida — NUNCA reescreve em silêncio.

export const REVISAO_CIENTIFICO_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildRevisaoCientificoPrompt(args: { secoes: SecaoGerada[]; sources: Source[] }): string {
  const { secoes, sources } = args;
  return `Você é um REVISOR CIENTÍFICO SÊNIOR (nível editor de revista médica indexada).
Recebe um texto científico COMPLETO (JSON estruturado) e as REFERÊNCIAS originais. NÃO reescreva
em silêncio: aponte cada problema E devolva uma versão corrigida à parte.

VERIFIQUE:
1. Consistência entre as seções (contradições, redundância, fio lógico do argumento).
2. Cada citação (source_id) aponta para uma REFERÊNCIA REAL da lista, e a âncora consta no texto dela.
3. Números, estatísticas, desfechos e doses foram TRANSCRITOS FIELMENTE das referências — sinalize divergências.
4. Afirmações que EXTRAPOLAM as referências (conclusão sem respaldo, generalização indevida) — sinalize como extrapolação.
Não invente conteúdo novo: o que não está nas referências é marcado "sem fonte", não preenchido.

REFERÊNCIAS:
${sourcesToText(sources)}

TEXTO (JSON):
${JSON.stringify({ secoes }, null, 2)}

Retorne APENAS JSON:
{"issues":[{"ref":"<seção ou trecho>","tipo":"citacao_invalida|sem_fonte|impreciso|dose_suspeita|estilo","severidade":"alta|media|baixa","descricao":"<o que está errado>","sugestao":"<como corrigir>"}],
 "corrigido":{"secoes":[{"secao":"<nome>","afirmacoes":[{"texto":"...","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}}`;
}
