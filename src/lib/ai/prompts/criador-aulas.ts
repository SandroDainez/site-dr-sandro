import { BLOCO_ANTI_ALUCINACAO } from "./anti-alucinacao";
import { AULA_SECOES_OPERACIONAIS } from "@/lib/editora/aula-estrutura";
import type { Source, SecaoGerada } from "../types";

// Prompt do módulo "Criador de Aulas" (versionado). Gera uma AULA em seções/slides para
// MÉDICOS a partir das referências, modulada pelo PÚBLICO-ALVO e pela DURAÇÃO ALVO. Mesmo
// núcleo anti-alucinação + formato estruturado (afirmações com source_id + âncora).
//
// v2 (jul/2026): diretriz de COMPLETUDE (mesmo padrão do Arquiteto de Protocolos) — aulas
// estavam saindo rasas demais para sustentar cursos. Duração alvo modula a PROFUNDIDADE de
// cada seção (quantos pontos, exemplos, nível de detalhe), não o número de seções.

export const CRIADOR_AULAS_PROMPT_VERSION = "2.0.0";

function sourcesToText(sources: Source[]): string {
  return sources
    .map((s) => `[${s.id}] (${s.tipo}${s.autor ? `, ${s.autor}` : ""}${s.ano ? `, ${s.ano}` : ""}) ${s.titulo}\n${s.texto}`)
    .join("\n\n---\n\n");
}

function secoesToText(secs: SecaoGerada[]): string {
  if (!secs.length) return "(nenhuma seção gerada ainda)";
  return secs
    .map((s) => `## ${s.secao}\n` + s.afirmacoes.map((a) => `- ${a.texto} [${a.source_id ?? "sem fonte"}]`).join("\n"))
    .join("\n\n");
}

// Monta o prompt de UM bloco: bloco anti-alucinação + instruções pedagógicas + público-alvo
// + duração-alvo + sources + seções já geradas + seções-alvo deste bloco.
export function buildCriadorAulasPrompt(args: {
  especialidade?: string;
  publicoAlvo?: string;
  duracaoAlvo?: string;
  sources: Source[];
  secoesAlvo: string[];
  secoesAnteriores: SecaoGerada[];
}): string {
  const { especialidade, publicoAlvo, duracaoAlvo, sources, secoesAlvo, secoesAnteriores } = args;

  const alvoComGuia = secoesAlvo.map((s) => {
    const operacional = AULA_SECOES_OPERACIONAIS.includes(s);
    return operacional ? `- ${s} [SÍNTESE — tipo geral, consolida o que já foi gerado, sem fato novo]` : `- ${s}`;
  }).join("\n");

  return `Você é um PROFESSOR de medicina montando uma AULA${especialidade ? ` (área: ${especialidade})` : ""} que pode
fazer parte de um CURSO completo — precisa ser uma aula de verdade, não um resumo de slides soltos.
Público-alvo: ${publicoAlvo || "Médicos"} — ajuste a PROFUNDIDADE e o vocabulário a esse público.
Duração alvo: ${duracaoAlvo || "Padrão (10–15 min)"} — quanto maior a duração, mais completa e detalhada
cada seção deve ficar (mais pontos, mais exemplos, mais nuance) — a duração NÃO reduz o número de seções.
Sua tarefa: redigir APENAS as seções deste bloco da aula, em português do Brasil, didática e objetiva,
com cada afirmação relevante ancorada nas REFERÊNCIAS.

${BLOCO_ANTI_ALUCINACAO}

PADRÃO DE QUALIDADE (aula completa, não resumida):
- COMPLETUDE: cada seção clínica deve ser DETALHADA — extraia dos sources TODOS os pontos relevantes
  para aquela seção (mecanismos, condutas, exceções, ressalvas), não um resumo raso de 2-3 frases.
  Varra o material inteiro em busca do que pertence àquela seção. Completude nunca justifica inventar:
  o que não tem respaldo literal na fonte é "sem fonte".
- "Título": título didático da aula (tipo "geral", sem exigir fonte).
- "Objetivos de aprendizagem": objetivos claros e verificáveis (o que o aluno saberá ao final).
- "Pré-requisitos": o que o aluno já deveria saber antes desta aula (tipo geral, se não vier das fontes).
- "Conceitos fundamentais" / "Mecanismo e fisiopatologia" / "Abordagem clínica e conduta": o cerne da
  aula — aqui é onde a completude importa mais.
- "Caso clínico ilustrativo": um caso (hipotético, plausível) que ilustra a aplicação do conteúdo —
  tipo "geral" (é um recurso didático, não uma afirmação de fato extraída da fonte).
- "Perguntas de fixação": 3-5 perguntas curtas com resposta, cobrindo os pontos já ensinados na aula
  (tipo geral — deriva do que já foi gerado, não introduz fato novo).
- Cada afirmação clínica/número/dose deve estar ancorada numa referência (âncora verbatim), transcrita
  fielmente. Adeque o nível ao público-alvo, mas NÃO invente conteúdo fora das referências.
- "Pontos-chave" e "Resumo": consolidam o que foi sustentado pelas referências, sem introduzir dado novo.

REFERÊNCIAS (material fornecido — use SÓ isto para sustentar afirmações):
${sourcesToText(sources)}

SEÇÕES JÁ GERADAS (contexto — não repita, mantenha coerência):
${secoesToText(secoesAnteriores)}

GERE AGORA, e SOMENTE, estas seções (nesta ordem), no formato JSON especificado.
Siga a orientação de cada seção quando houver:
${alvoComGuia}`;
}
