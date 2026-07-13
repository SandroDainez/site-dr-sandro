import type { Source, SecaoGerada } from "../types";

// Prompt do ESTÁGIO 2 (revisão, GPT-4o) do Criador de Aulas. Versionado.
// A revisão APONTA problemas e produz versão corrigida — NUNCA reescreve em silêncio.

export const REVISAO_AULAS_PROMPT_VERSION = "1.1.0";

function sourcesToText(sources: Source[]): string {
  return sources.map((s) => `[${s.id}] ${s.titulo} (${s.tipo})\n${s.texto}`).join("\n\n---\n\n");
}

export function buildRevisaoAulasPrompt(args: { secoes: SecaoGerada[]; sources: Source[] }): string {
  const { secoes, sources } = args;
  return `Você é um REVISOR PEDAGÓGICO SÊNIOR de material de ensino médico.
Recebe uma AULA COMPLETA (JSON estruturado, seções = slides) e as REFERÊNCIAS originais. NÃO
reescreva em silêncio: aponte cada problema E devolva uma versão corrigida à parte.

VERIFIQUE:
0. COERÊNCIA DE TEMA (crítico): sinalize como severidade ALTA (tipo "off_topic") qualquer trecho, afirmação ou item que seja de OUTRO tema, doença ou especialidade que não o assunto central deste conteúdo — mesmo bem escrito e citado. Aponte o trecho exato e sugira REMOVER (não pertence aqui).
1. Coerência pedagógica: os "Objetivos de aprendizagem" são cobertos pelo conteúdo; a sequência é lógica.
2. Cada citação (source_id) aponta para uma REFERÊNCIA REAL da lista, e a âncora consta no texto dela.
3. Números, doses e desfechos foram TRANSCRITOS FIELMENTE das referências — sinalize divergências.
4. Afirmações que EXTRAPOLAM as referências (conteúdo "de memória", generalização indevida) — sinalize.
Não invente conteúdo novo: o que não está nas referências é marcado "sem fonte", não preenchido.

REFERÊNCIAS:
${sourcesToText(sources)}

AULA (JSON):
${JSON.stringify({ secoes }, null, 2)}

Retorne APENAS JSON:
{"issues":[{"ref":"<seção ou trecho>","tipo":"off_topic|citacao_invalida|sem_fonte|impreciso|dose_suspeita|estilo","severidade":"alta|media|baixa","descricao":"<o que está errado>","sugestao":"<como corrigir>"}],
 "corrigido":{"secoes":[{"secao":"<nome>","afirmacoes":[{"texto":"...","source_id":"<id|null>","ancora":"<verbatim|null>","tipo":"clinica|dose|geral"}]}]}}`;
}
