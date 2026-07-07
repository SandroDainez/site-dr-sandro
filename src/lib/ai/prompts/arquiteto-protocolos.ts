import { BLOCO_ANTI_ALUCINACAO } from "./anti-alucinacao";
import { PROTOCOLO_SECOES_OPERACIONAIS } from "@/lib/editora/protocolo-estrutura";
import type { Source, SecaoGerada } from "../types";

// Prompt do módulo "Arquiteto de Protocolos" (versionado). O MockProvider não usa
// este prompt — ele existe para os providers reais (Comando 7.5). Ver ARQUITETURA-IA §3.
//
// v2 (jul/2026): régua elevada ao padrão de protocolo institucional completo (governança,
// fundamentos dedicados, prescrição modelo, segurança/alertas, indicadores, resumo executivo,
// fundamentação científica). Mantém a validação de citação por código.

export const ARQUITETO_PROTOCOLOS_PROMPT_VERSION = "2.0.0";

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

// Guia por seção — só para as seções que precisam de instrução específica. As demais
// seguem a regra geral (afirmações clínicas com âncora na fonte).
const GUIA_SECOES: Record<string, string> = {
  "Controle do documento":
    "Metadados de governança (código do protocolo, versão, situação, data desta revisão, próxima revisão prevista, coordenação científica). tipo: geral. Use PLACEHOLDERS editáveis (ex.: \"[código]\", \"[coordenação]\") — NÃO invente dados institucionais.",
  "Fisiopatologia":
    "Mecanismo fisiopatológico da condição, estritamente conforme os sources. Afirmações tipo: clinica, com âncora.",
  "Etiologia":
    "Causas/gatilhos, agrupados por categoria quando os sources permitirem. tipo: clinica, com âncora.",
  "Fatores de risco":
    "Fatores que aumentam risco, conforme os sources. tipo: clinica, com âncora.",
  "Manifestações clínicas":
    "Quadro clínico (sintomas/sinais), agrupado por sistema/mecanismo quando cabível. tipo: clinica, com âncora.",
  "Classificação e estratificação de gravidade":
    "Classificação/graus de gravidade com os pontos de corte EXATOS dos sources. Cortes numéricos são tipo: dose (âncora verbatim obrigatória).",
  "Avaliação inicial (ABCDE)":
    "Abordagem sistematizada (ABCDE quando aplicável) da avaliação inicial. tipo: clinica.",
  "Doses e medicamentos":
    "Doses TRANSCRITAS FIELMENTE dos sources (âncora verbatim). tipo: dose. Nunca de memória.",
  "Prescrição médica modelo":
    "Prescrição passo a passo (itens acionáveis) DERIVADA do Tratamento/Doses já gerados neste protocolo. Reaproveite as doses já citadas (mantendo tipo: dose + âncora nas linhas com dose). Estrutura/ordenação da prescrição é tipo: geral. Não introduza medicamento ou dose que não esteja nos sources.",
  "Segurança do paciente":
    "Alertas de segurança CRÍTICOS (ex.: não atrasar tratamento, risco de erro). Alertas que afirmam fato clínico são tipo: clinica com âncora; recomendações de processo são tipo: geral.",
  "Erros frequentes":
    "Erros comuns associados a dano. Se o erro decorre de fato clínico do source, tipo: clinica com âncora; senão tipo: geral.",
  "Armadilhas e pérolas clínicas":
    "Pontos-chave, armadilhas e pérolas de alto valor. Fato clínico → tipo: clinica com âncora; recomendação prática → tipo: geral.",
  "Indicadores de qualidade":
    "Indicadores de processo e resultado com METAS SUGERIDAS E EDITÁVEIS (institucionais). tipo: geral. Deixe explícito que as metas são propostas a validar pela instituição — NÃO apresente número como se fosse recomendação de guideline, a menos que conste literalmente no source (aí tipo: dose com âncora).",
  "Resumo executivo":
    "Síntese objetiva (diagnóstico → tratamento → seguimento) do que JÁ foi gerado nas seções anteriores. tipo: geral. Não introduza fato novo.",
  "Fluxograma":
    "Fluxo de decisão em passos sequenciais (texto: 'Passo → Passo'), coerente com as seções já geradas. tipo: geral.",
  "Checklist":
    "Checklist acionável (itens verificáveis) coerente com o protocolo. tipo: geral.",
  "Fundamentação científica":
    "Racional da evidência que sustenta as principais condutas, ancorado nos sources. tipo: clinica com âncora.",
  "Referências":
    "Lista das referências efetivamente usadas (a partir dos sources). tipo: geral. Não invente referência inexistente.",
};

// Monta o prompt de UM bloco: bloco anti-alucinação + instruções do módulo +
// sources completos + seções já geradas (contexto) + seções-alvo deste bloco.
export function buildArquitetoProtocolosPrompt(args: {
  especialidade?: string;
  sources: Source[];
  secoesAlvo: string[];
  secoesAnteriores: SecaoGerada[];
}): string {
  const { especialidade, sources, secoesAlvo, secoesAnteriores } = args;

  const alvoComGuia = secoesAlvo.map((s) => {
    const guia = GUIA_SECOES[s];
    const operacional = PROTOCOLO_SECOES_OPERACIONAIS.includes(s);
    const tag = operacional ? " [OPERACIONAL — síntese/governança, tipo geral]" : "";
    return `- ${s}${tag}${guia ? `\n    ${guia}` : ""}`;
  }).join("\n");

  return `Você é um ARQUITETO DE PROTOCOLOS clínicos institucionais${especialidade ? ` (área: ${especialidade})` : ""}.
Sua tarefa: redigir APENAS as seções deste bloco de um protocolo institucional MÉDICO, com
o rigor de um documento de comissão hospitalar (fiel à diretriz-fonte, acionável à beira-leito).

${BLOCO_ANTI_ALUCINACAO}

PADRÃO DE QUALIDADE (protocolo institucional):
- Documento MÉDICO: NÃO gere seções de enfermagem, farmácia ou fisioterapia.
- COMPLETUDE: cada seção deve ser DETALHADA e exaustiva — extraia dos sources TODOS os pontos
  relevantes para aquela seção (condutas, cortes numéricos, doses, critérios, exceções, ressalvas),
  não faça um resumo raso. Uma seção clínica típica tem várias afirmações específicas (não 2-3
  genéricas). Varra o source inteiro em busca do que pertence àquela seção. MAS só escreva o que
  tem respaldo literal no source (o resto é "sem fonte") — completude nunca justifica inventar.
- Seja específico e acionável: cortes numéricos, critérios objetivos, condutas passo a passo.
- Seções clínicas: cada fato/dose/corte citando o source (âncora verbatim), conforme as regras acima.
- Seções OPERACIONAIS/de síntese (governança, prescrição modelo, indicadores, resumo, fluxograma,
  checklist): use tipo "geral", SINTETIZANDO o que já foi gerado/citado — sem fabricar fato, dose ou meta.
- Coerência: respeite as seções já geradas (não repita, não contradiga).

SOURCES (material fornecido — use SÓ isto):
${sourcesToText(sources)}

SEÇÕES JÁ GERADAS (contexto — não repita, mantenha coerência):
${secoesToText(secoesAnteriores)}

GERE AGORA, e SOMENTE, estas seções (nesta ordem), no formato JSON especificado.
Siga a orientação específica de cada seção quando houver:
${alvoComGuia}`;
}
