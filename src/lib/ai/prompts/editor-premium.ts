import { BLOCO_ANTI_ALUCINACAO } from "./anti-alucinacao";
import type { Source, SecaoGerada } from "../types";

// Prompt do módulo "Editor Premium" (versionado). EDIÇÃO/refinamento: recebe um RASCUNHO
// já escrito + as REFERÊNCIAS e o densifica/melhora a forma, mantendo cada afirmação
// ancorada nas fontes. Mesmo núcleo anti-alucinação + formato estruturado do Editor
// Científico. Não inventa: o que o rascunho afirma sem respaldo nas referências vira
// "sem fonte". Ver ARQUITETURA-IA §2 (Editor Premium: geração/edição, 2 estágios).

export const EDITOR_PREMIUM_PROMPT_VERSION = "1.0.0";

function sourcesToText(sources: Source[]): string {
  return sources
    .map((s) => `[${s.id}] (${s.tipo}${s.autor ? `, ${s.autor}` : ""}${s.ano ? `, ${s.ano}` : ""}) ${s.titulo}\n${s.texto}`)
    .join("\n\n---\n\n");
}

function secoesToText(secs: SecaoGerada[]): string {
  if (!secs.length) return "(nenhuma seção refinada ainda)";
  return secs
    .map((s) => `## ${s.secao}\n` + s.afirmacoes.map((a) => `- ${a.texto} [${a.source_id ?? "sem fonte"}]`).join("\n"))
    .join("\n\n");
}

// Monta o prompt de UM bloco de refinamento: bloco anti-alucinação + instruções de edição
// premium + RASCUNHO do autor + referências + seções já refinadas + seções-alvo deste bloco.
export function buildEditorPremiumPrompt(args: {
  especialidade?: string;
  rascunho: string;
  sources: Source[];
  secoesAlvo: string[];
  secoesAnteriores: SecaoGerada[];
}): string {
  const { especialidade, rascunho, sources, secoesAlvo, secoesAnteriores } = args;
  return `Você é um EDITOR PREMIUM médico${especialidade ? ` (área: ${especialidade})` : ""}, para um público de MÉDICOS.
Sua tarefa: REFINAR o RASCUNHO abaixo, produzindo APENAS as seções deste bloco em português do Brasil.
Foque em DENSIDADE e FORMA: prosa técnico-acadêmica precisa, coesa e sem redundância. Preserve o
sentido do autor; melhore clareza, estrutura e rigor. NÃO adicione conteúdo novo que não esteja
sustentado nas REFERÊNCIAS — o que o rascunho afirmar sem respaldo vira "sem fonte" (source_id: null).

${BLOCO_ANTI_ALUCINACAO}

DIRETRIZES DE EDIÇÃO PREMIUM:
- Reescreva para maior densidade informacional e melhor forma, sem inflar com texto vazio.
- Cada dado (número, estatística, desfecho, dose) deve estar ancorado numa referência (âncora verbatim); transcreva fielmente.
- Não introduza afirmações que não estejam no rascunho NEM nas referências.
- "Título" e "Resumo" podem ser aprimorados a partir do rascunho e das referências.

RASCUNHO DO AUTOR (a ser refinado):
${rascunho?.trim() || "(rascunho vazio — componha a partir apenas das referências)"}

REFERÊNCIAS (material verificável — use SÓ isto para sustentar afirmações):
${sourcesToText(sources)}

SEÇÕES JÁ REFINADAS (contexto — não repita, mantenha coerência):
${secoesToText(secoesAnteriores)}

GERE AGORA, e SOMENTE, estas seções (nesta ordem), no formato JSON especificado:
${secoesAlvo.map((s) => `- ${s}`).join("\n")}`;
}
