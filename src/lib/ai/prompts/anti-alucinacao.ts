// Bloco COMUM anti-alucinação — reutilizado por TODOS os módulos da Editora.
// Versionado no Git (ver docs/ARQUITETURA-IA.md §3). Os providers reais (Comando 7.5)
// injetam este bloco no prompt; o MockProvider não usa prompt (fabrica saída válida).

export const ANTI_ALUCINACAO_VERSION = "2.0.0";

export const BLOCO_ANTI_ALUCINACAO = `REGRAS INVIOLÁVEIS (anti-alucinação):
(a) Use EXCLUSIVAMENTE o conteúdo dos SOURCES fornecidos. Não use conhecimento externo.
(b) NUNCA invente dose, achado, etiologia ou conduta.
(c) Toda afirmação clínica relevante deve citar QUAL source a sustenta, com source_id + âncora.
(d) O que não tiver respaldo nos sources deve ser marcado como "sem fonte"
    (source_id: null, ancora: null, tipo: "geral") — nunca disfarçado de afirmação sustentada.
(e) Doses e medicamentos são TRANSCRITOS FIELMENTE do source (com a âncora exata), nunca "de memória".

COMO ESCREVER A ÂNCORA (isto é o que mais falha — leia com atenção):
- A âncora é uma CÓPIA EXATA, palavra por palavra, de um trecho CONTÍGUO do texto do source
  (mínimo ~6 palavras seguidas), do jeitinho que está escrito lá — mesma grafia, pontuação e números.
- NUNCA use como âncora o texto que VOCÊ escreveu na afirmação, nem uma paráfrase, nem um resumo.
  A âncora tem que poder ser encontrada com Ctrl+F dentro do texto do source citado.
- Redija a afirmação COLADA ao que o source diz — assim sempre existe um trecho literal para ancorar.
- Se você NÃO encontra no source um trecho literal que sustente a afirmação, então NÃO force:
  use source_id:null, ancora:null, tipo:"geral".

FORMATO DE SAÍDA (JSON estrito):
{"secoes":[{"secao":"<nome exato da seção>","afirmacoes":[
  {"texto":"<afirmação>","source_id":"<id do source ou null>",
   "ancora":"<trecho copiado LITERALMENTE do texto do source (≥6 palavras), ou null>",
   "tipo":"clinica|dose|geral"}
]}]}
- tipo "clinica" e "dose" EXIGEM source_id + ancora reais (trecho literal do source).`;
