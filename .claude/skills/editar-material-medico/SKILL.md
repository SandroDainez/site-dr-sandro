---
name: editar-material-medico
description: Criar, reconstruir, atualizar, revisar e auditar capítulos, livros, manuais, protocolos, aulas, algoritmos, questões e outros materiais médicos originais, baseados em evidências, rastreáveis e adaptados ao Brasil. Usar quando houver um tema ou material de apoio a transformar em conteúdo do MedCampus, quando for necessário separar redação e auditoria entre agentes independentes, ou quando um documento médico precisar de verificação científica, farmacológica, editorial, de segurança, cobertura, referências e risco de similaridade antes da publicação.
---

# Editar material médico

> **Nota de escopo (repositório MedCampus).** Esta skill guia o trabalho de IA ao GERAR/EDITAR
> material clínico junto com o desenvolvedor (etapa "B"). O miolo científico — Editor+Auditor
> independentes, nunca inventar, farmacologia M0–M4, severidade e gate de aprovação — vale sempre.
> As fases de EMPACOTAMENTO pesado (pacote de revisão humana em PDF da Fase 5, DOCX, `scripts/
> validar_publicacao.py`, contrato visual) NÃO existem neste repo e ficam como aspiração: quando um
> passo depender delas, adapte ao contexto web e declare a limitação, em vez de inventar o artefato.
> A integração do auditor M0–M4 + gate de severidade DENTRO do pipeline da Editora Médica (código do
> app) é a etapa "A", ainda pendente — ver a memória `site_dr_sandro_editora_auditor_m0m4`.

## Objetivo

Coordenar um Editor Científico e um Auditor Científico independentes para produzir material original, seguro, rastreável e adequado ao público e ao cenário clínico. Tratar material comercial ou protegido apenas como mapa de cobertura e objeto de comparação; nunca como fonte científica principal nem como modelo textual.

## Carregar instruções

Ler obrigatoriamente:

- [editor-cientifico.md](references/editor-cientifico.md) antes de iniciar a Fase 1.
- [auditor-cientifico.md](references/auditor-cientifico.md) antes de iniciar a Fase 2.
- [governanca-e-rastreabilidade.md](references/governanca-e-rastreabilidade.md) em todas as execuções.
- [templates-editoriais.md](references/templates-editoriais.md) para selecionar o produto.
- [criterios-de-aprovacao.md](references/criterios-de-aprovacao.md) ao auditar, corrigir e encerrar.
- [revisao-humana-e-marca.md](references/revisao-humana-e-marca.md) sempre que o
  produto for entregue para revisão médica humana ou usar a marca MedCampus.
- [padrao-pacote-revisao.md](references/padrao-pacote-revisao.md) integralmente antes
  de gerar qualquer PDF ou DOCX para revisão médica humana.
- [lapidacao-editorial.md](references/lapidacao-editorial.md) depois da reauditoria
  científica e antes de diagramar qualquer produto clínico.
- [acabamento-final.md](references/acabamento-final.md) sempre que gerar DOCX ou PDF
  destinado à publicação ou entrega final.

## Princípios inegociáveis

Priorizar, nesta ordem: segurança do paciente, precisão, evidência, atualização, originalidade, clareza, aplicabilidade, adequação ao Brasil, padronização e transparência.

Não inventar estudos, referências, DOI, diretrizes, autores, datas, estatísticas, doses, diluições, esquemas, classes, níveis de evidência ou resultados. Marcar uma afirmação sem validação como **“Não validada — requer confirmação em fonte apropriada.”** Quando a evidência não permitir conclusão, escrever **“Evidência insuficiente para recomendação definitiva.”**

Pesquisar informações médicas atuais na internet e usar fontes primárias ou oficiais. Preferir diretrizes vigentes, documentos regulatórios, revisões sistemáticas e estudos originais conforme o tipo de afirmação. Não citar uma fonte sem confirmar que existe e sustenta a afirmação. Registrar a data de corte da pesquisa.

Não afirmar que revisão por IA equivale a revisão humana institucional. Não declarar originalidade absoluta; avaliar apenas o risco de similaridade em relação ao corpus efetivamente comparado.

## Identificar o projeto

Determinar, perguntando apenas quando a inferência segura não for possível:

- produto: capítulo, guia terapêutico, protocolo, algoritmo, aula, procedimento, resumo, questões ou auditoria;
- público, objetivo educacional e profundidade;
- adulto, pediátrico, obstétrico ou combinações;
- cenário: pré-hospitalar, pronto-socorro, enfermaria, centro cirúrgico, UTI ou estudo;
- conteúdo educacional ou operacional;
- recursos assistenciais presumidos e contexto brasileiro;
- formato final e extensão;
- material de apoio e fontes fornecidas.

Se o usuário pedir continuação ou versão final de projeto anterior, recuperar o estado, índice mestre, decisões editoriais e artefatos disponíveis antes de trabalhar.

## Orquestrar agentes

Usar dois agentes distintos quando o ambiente permitir:

1. **Editor Científico** — recebe escopo, material de apoio e fontes; pesquisa, cria o mapa de cobertura, redige do zero e entrega o dossiê editorial.
2. **Auditor Científico** — recebe os artefatos brutos do projeto e as fontes, sem receber conclusões favoráveis do Editor; refaz verificações críticas e emite parecer independente.

O agente principal atua como coordenador e não substitui a independência entre os dois. Fornecer a cada agente apenas o contexto necessário e os arquivos brutos. Não revelar ao Auditor notas esperadas, suspeitas ou justificativas defensivas do Editor.

Se agentes separados não estiverem disponíveis, executar passes separados e declarar essa limitação. Nunca representar passes simulados como auditoria independente.

## Fluxo obrigatório

### Fase 0 — Preparação

1. Definir escopo e selecionar o template.
2. Ler integralmente os materiais fornecidos.
3. Extrair mapa de cobertura sem copiar redação ou estrutura criativa distintiva.
4. Planejar pesquisa conforme risco das afirmações.
5. Criar registro do projeto: versão, data, escopo, público, cenário, fontes fornecidas e pendências.

### Fase 1 — Produção pelo Editor

1. Aplicar [editor-cientifico.md](references/editor-cientifico.md).
2. Pesquisar e verificar fontes atuais.
3. Produzir conteúdo original.
4. Entregar capítulo e dossiê com mapa de cobertura, matriz de evidências, inventário farmacológico, divergências e pendências.
5. Não atribuir nota nem aprovar o próprio trabalho.

### Fase 2 — Auditoria independente

1. Aplicar [auditor-cientifico.md](references/auditor-cientifico.md).
2. Verificar prioritariamente afirmações de risco alto, doses, algoritmos e referências.
3. Comparar cobertura e risco de similaridade com o material de apoio.
4. Classificar achados e emitir parecer segundo [criterios-de-aprovacao.md](references/criterios-de-aprovacao.md).

### Fase 3 — Correção

1. Devolver ao Editor os achados críticos, importantes, moderados e pendências objetivas.
2. Corrigir o texto e atualizar a matriz de evidências e o controle de mudanças.
3. Preservar conteúdo correto; não reescrever sem necessidade.

### Fase 4 — Reauditoria e encerramento

1. O Auditor verificar cada correção obrigatória e possíveis efeitos colaterais.
2. Reabrir o ciclo se restar erro crítico, dose não validada ou recomendação insegura.
3. Gerar relatório executivo, anexo técnico, versão consolidada e estado editorial.
4. Marcar **pendente de revisão médica humana** somente até ocorrer revisão médica
   humana documentada. Em capítulo educacional, essa revisão encerra a pendência
   editorial sem transformar o material em protocolo institucional. Exigir aprovação
   formal do responsável técnico apenas quando o produto se apresentar como protocolo
   institucional ou for adotado oficialmente por um serviço.

### Fase 4.5 — Lapidação editorial e usabilidade

Executar obrigatoriamente
[lapidacao-editorial.md](references/lapidacao-editorial.md) depois de fechar os achados
científicos e antes de gerar o pacote de revisão humana.

1. reduzir densidade visual sem retirar conteúdo clinicamente necessário;
2. organizar blocos longos em subtítulos operacionais quando isso melhorar a consulta;
3. classificar e padronizar alertas, armadilhas e pontos práticos;
4. avaliar formalmente a necessidade de fluxograma em sequências decisórias;
5. converter tabelas genéricas em tabelas orientadas à decisão;
6. transformar listas executáveis em checklists reais;
7. confirmar a separação entre guia rápido, capítulo clínico, versão para revisão e
   dossiê interno;
8. aplicar a matriz do pacote operacional mínimo: metas fisiológicas/terapêuticas,
   algoritmo visual de síntese, reavaliação e pós-intervenção, populações especiais,
   alternativas técnicas, uso criterioso de fluidos e checklists anexos;
9. usar `Fluxo operacional` como rótulo único das sequências decisórias;
10. avaliar algoritmos adicionais para cada caminho crítico de alto risco;
11. diagramar, quando aplicável, folha destacável de uma página com os checklists
    prioritários;
12. executar copydesk final de referências, espaços, travessões, siglas, hifenização,
    capitalização e nomenclatura;
13. auditar individualmente toda nova citação e toda linha farmacológica operacional,
    confirmando que a fonte sustenta exatamente dose, duração, contraindicação, ajuste,
    descritor de peso e aplicabilidade brasileira;
14. inserir bloco de governança proporcional ao destino do material, sem inventar
    responsável, aprovação ou competência institucional;
15. produzir relatório breve do gate com itens aprovados, corrigidos e não aplicáveis.

Não iniciar a diagramação enquanto houver bloco excessivamente denso, alerta crítico
escondido em prosa, sequência decisória sem avaliação de fluxograma, tabela terapêutica
genérica, meta aplicável ausente, pós-intervenção incompleto, população especial
relevante não avaliada ou checklist não executável.

### Fase 5 — Pacote de revisão médica humana

Quando o material chegar ao estado **pendente de revisão médica humana**:

> **CONTRATO OBRIGATÓRIO DE FORMATO — NÃO IMPROVISAR**
>
> Reproduzir o sistema visual e funcional consolidado no pacote
> **MedCampus — Choque no trauma — Revisão Humana v0.5**, conforme
> [padrao-pacote-revisao.md](references/padrao-pacote-revisao.md).
> Não criar uma identidade alternativa, formulário genérico ou versão “equivalente”.
> Uma decisão por página continua permitida, mas somente dentro do cartão rosado
> padronizado, com contexto autossuficiente, opções compactas e campo proporcional.
> Rejeitar páginas dominadas por caixa vazia, título isolado ou instrução genérica.
> Se o pacote de referência não estiver disponível, usar exatamente os tokens,
> a geometria e o checklist descritos no arquivo de padrão.

1. destacar, junto às respectivas seções, todos os pontos que exigem decisão clínica,
   institucional, farmacêutica, hemoterápica ou editorial;
2. atribuir um ID estável a cada ponto, preservado na revisão e na edição final;
3. gerar resumo final navegável com links internos para cada ponto;
4. gerar formulário preenchível no PDF, com as opções **Manter sem alteração**,
   **Modificar** e **Retirar**, além de campo amplo para modificação ou justificativa;
5. incluir identificação do revisor, parecer global, observações gerais e confirmação final;
6. gerar também DOCX editável quando o pacote completo for solicitado;
7. aplicar a identidade visual MedCampus conforme
   [revisao-humana-e-marca.md](references/revisao-humana-e-marca.md);
8. reabrir a Fase 3 quando o PDF preenchido retornar e produzir nova versão com controle
   explícito de cada decisão.

Antes da entrega, executar o gate específico do pacote de revisão:

1. comparar visualmente capa/registro, resumo, uma página RH intermediária e confirmação
   final com o padrão de referência;
2. confirmar presença dos três rótulos em todos os pontos: **O que observar**,
   **O que você precisa decidir** e **Como responder**;
3. confirmar que nenhuma página RH contém somente título, frase genérica e campo vazio;
4. validar links do resumo, grupos exclusivos de rádio, campos multilinha, ausência de
   `/MaxLen`, preservação de texto longo e aparências dos widgets;
5. reprovar e reconstruir o pacote se qualquer item falhar. Não entregar com ressalva.

### Fase 6 — Higienização da versão final

Depois da revisão médica humana, executar obrigatoriamente a higienização editorial
descrita em [revisao-humana-e-marca.md](references/revisao-humana-e-marca.md).
Remover do produto público toda linguagem de processo, revisão, auditoria, pendência,
validação ou criação do material. Manter rastreabilidade, pareceres e controles somente
no dossiê técnico interno. Não entregar versão final com campos, destaques ou marcas de
revisão.

Aplicar também o gate de publicação de [acabamento-final.md](references/acabamento-final.md):
terminologia brasileira, numeração, tabelas, cabeçalho, páginas vazias, renderização e
escopo da entrega. Executar `scripts/validar_publicacao.py` no PDF público. Corrigir e
renderizar novamente até o gate aprovar.

Se o documento for apresentado para possível adoção por um serviço, incluir metadados de governança:
versão, data, data de corte científico, próxima revisão prevista, estado editorial,
escopo, dependências de recurso/competência local e campos identificados como pendentes
para responsável técnico e aprovação institucional. Nunca apresentar esses campos como
preenchidos ou aprovados sem informação explícita do usuário.

Para capítulo educacional já revisado por médico, usar estado como `Revisado para
publicação educacional` ou equivalente. Não exibir `pendente de revisão médica humana`.
Manter a declaração de que o conteúdo não substitui protocolo institucional, treinamento
formal nem julgamento clínico.

## Continuidade de obras longas

Manter índice mestre, glossário, abreviações, estilo de tabelas, referências utilizadas, capítulos concluídos, pendências, versões e referências cruzadas. Trabalhar em blocos controláveis; não truncar silenciosamente. Ao consolidar, revisar redundâncias, numeração, terminologia, citações e coerência entre capítulos.

## Entrega

Entregar conforme o pedido:

1. resumo executivo;
2. escopo, data de corte e limitações;
3. material médico consolidado;
4. matriz de evidências;
5. relatório de auditoria e correções;
6. referências verificadas em Vancouver, salvo padrão diferente;
7. estado editorial e pendências humanas.

Para versões destinadas à revisão humana, incluir obrigatoriamente o pacote da Fase 5.

Criar DOCX ou PDF apenas quando solicitado ou quando a entrega final de uma obra exigir artefato. Aplicar as skills específicas de documentos ou PDF e realizar verificação visual antes de entregar.

Por padrão, apresentar somente o produto público principal nos formatos pedidos. Manter
guia autônomo, dossiê interno, relatório de auditoria e arquivos intermediários
preservados, mas não entregá-los como arquivos adicionais sem solicitação explícita.
