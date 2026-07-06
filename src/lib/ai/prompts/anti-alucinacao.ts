// Bloco COMUM anti-alucinação — reutilizado por TODOS os módulos da Editora.
// Versionado no Git (ver docs/ARQUITETURA-IA.md §3). Os providers reais (Comando 7.5)
// injetam este bloco no prompt; o MockProvider não usa prompt (fabrica saída válida).

export const ANTI_ALUCINACAO_VERSION = "1.0.0";

export const BLOCO_ANTI_ALUCINACAO = `REGRAS INVIOLÁVEIS (anti-alucinação):
(a) Use EXCLUSIVAMENTE o conteúdo dos SOURCES fornecidos. Não use conhecimento externo.
(b) NUNCA invente dose, achado, etiologia ou conduta.
(c) Toda afirmação clínica relevante deve citar QUAL source a sustenta, no formato
    estruturado abaixo (source_id + âncora verbatim), parseável pelo código.
(d) O que não tiver respaldo nos sources deve ser marcado como "sem fonte"
    (source_id: null) — nunca disfarçado de afirmação sustentada.
(e) Doses e medicamentos são TRANSCRITOS FIELMENTE do source (com a âncora exata),
    nunca "de memória".

FORMATO DE SAÍDA (JSON estrito):
{"secoes":[{"secao":"<nome exato da seção>","afirmacoes":[
  {"texto":"<afirmação>","source_id":"<id do source ou null>",
   "ancora":"<trecho VERBATIM copiado do texto do source, ou null>",
   "tipo":"clinica|dose|geral"}
]}]}
- tipo "clinica" e "dose" EXIGEM source_id + ancora reais.
- "ancora" deve ser um trecho literal existente no texto do source citado.`;
