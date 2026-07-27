# Revisão médica humana e marca MedCampus

## Aplicação obrigatória

Aplicar estas regras a qualquer documento marcado como **versão para revisão médica
humana**. Não considerar uma nota livre ao revisor como substituta do formulário.

## Padrão visual obrigatório

Ler e aplicar integralmente
[padrao-pacote-revisao.md](padrao-pacote-revisao.md). O padrão consolidado no pacote
MedCampus **Choque no trauma — Revisão Humana v0.5** é normativo. Não criar variações
visuais, formulários simplificados ou novas proporções sem solicitação expressa do
usuário. Reprovar páginas de decisão sem cartão rosado, sem os três blocos contextuais
ou dominadas por campo vazio.

## Destaques no corpo

- Inserir o destaque no fluxo normal do documento, imediatamente após o trecho ao qual
  se refere, com reflow do texto. Nunca sobrepor caixa, logo ou anotação ao conteúdo.
- Quando a fonte for um PDF fechado, reconstruir a partir do DOCX ou do conteúdo-fonte.
  Não resolver falta de espaço colocando caixas flutuantes sobre a página.
- Usar IDs sequenciais estáveis: `RH-01`, `RH-02` etc.
- Estruturar cada destaque com três rótulos:
  - **O que observar:** trecho, conflito ou escolha que merece atenção;
  - **O que você precisa decidir:** decisão clínica ou editorial concreta;
  - **Como responder:** manter, modificar ou retirar; se modificar, indicar a redação,
    meta, dose, condição ou fluxo desejado.
- Explicar diretamente por que a decisão altera segurança, aplicabilidade, padronização
  ou didática. Evitar perguntas vagas como “Aprovar?”.
- Não destacar apenas erros. Incluir escolhas institucionais, disponibilidade local,
  divergências legítimas e decisões editoriais relevantes.
- Repetir o ID no resumo navegável, no formulário e no controle de mudanças.

## Resumo navegável

Incluir antes do formulário uma tabela ou lista com:

- ID e título curto;
- seção/página;
- decisão solicitada;
- gravidade ou tipo;
- link interno para o destaque correspondente e link de retorno ao resumo.

## Formulário preenchível

Criar AcroForm real no PDF. Para cada ID incluir:

- enunciado autossuficiente da decisão;
- contexto curto do trecho atual;
- lista objetiva do que deve ser conferido;
- formulação exata da decisão esperada;
- grupo exclusivo com as opções:
  - **Manter sem alteração**;
  - **Modificar**;
  - **Retirar**;
- campo multilinha amplo para modificação ou justificativa.
- campo sem limite prático de caracteres, com quebra automática de linha e rolagem
  vertical quando o conteúdo ultrapassar a área visível;

Incluir ainda:

- nome, especialidade, instituição e data;
- parecer global: aprovar sem alterações, aprovar com ajustes ou solicitar nova revisão;
- observações gerais;
- confirmação de que todos os pontos foram analisados;
- instrução para devolver o PDF preenchido para a edição final.

Validar o PDF conforme a skill de PDF: árvore `/AcroForm/Fields`, widgets, valores,
aparências e renderização. Manter o formulário interativo.

Antes da entrega, preencher um campo com texto de teste longo, contendo várias linhas e
mais de 1.000 caracteres; salvar, fechar e reabrir. Confirmar que o valor completo foi
preservado e que não existe `/MaxLen` nos campos narrativos.

## DOCX

Quando houver DOCX, reproduzir os mesmos IDs e opções com caixas visuais e áreas amplas
para digitação. O DOCX não substitui o PDF preenchível.

## Marca MedCampus

- Usar o arquivo `assets/medcampus-logo.png`.
- Posicionar o logo em todas as páginas, no canto superior esquerdo.
- Usar tamanho claramente visível, com largura usual entre 22 e 30 mm; ampliar na capa.
- Preservar proporção, nitidez e área de respiro.
- Não substituir o logo por texto simples “MEDCAMPUS”.
- Manter cabeçalho discreto à direita e não permitir que texto, tabelas ou destaques
  invadam o logo.
- Reservar uma faixa real de cabeçalho antes de inserir o logo. Não aplicar um logo grande
  como sobreposição sobre PDF fechado sem confirmar a área livre existente.
- Se a margem do documento não comportar 22–30 mm, reformatar o documento para criar a
  faixa de cabeçalho ou reduzir o logo até que haja separação visual segura. A ausência de
  sobreposição prevalece sobre o tamanho preferencial.
- Renderizar e inspecionar todas as páginas após inserir a marca. Reprovar a entrega se
  qualquer parte do logo tocar ou cobrir título, texto, tabela, destaque ou numeração.

## Entrega e retorno

Entregar o conteúdo, o formulário e o dossiê com a mesma versão. Quando o formulário
retornar preenchido:

1. extrair cada escolha e observação;
2. gerar tabela de decisões aceitas, rejeitadas e pendentes;
3. aplicar somente alterações autorizadas;
4. atualizar matriz, inventário e controle de versões;
5. reauditar alterações clínicas;
6. emitir nova versão ainda pendente de aprovação formal, salvo aprovação expressa do
   responsável técnico.

## Higienização obrigatória da versão final

Após a aprovação humana e antes da entrega pública, gerar uma cópia editorial limpa.
Remover integralmente do corpo, capa, cabeçalhos, rodapés, sumário e metadados:

- “versão para revisão médica humana” e equivalentes;
- “nota ao revisor”, “parecer do revisor” e “revisão por IA”;
- notas, notas finais, escores ou justificativas produzidas por agentes;
- “pontos que merecem validação institucional”;
- “conteúdo educacional pendente”, “produção científica inicial” e estados editoriais;
- IDs `RH-*`, destaques coloridos, links de revisão e instruções de devolução;
- caixas de seleção, campos AcroForm, comentários e respostas do revisor;
- matriz de evidências, inventário farmacológico, registro de similaridade, controle de
  versões, histórico de correções e relatórios de auditoria, salvo se o usuário pedir
  explicitamente um anexo técnico público;
- nomes de agentes, etapas da skill, prompts, ferramentas e qualquer explicação sobre
  como o material foi criado.

Não remover alertas clínicos, limitações assistenciais reais, contraindicações, incerteza
da evidência ou dependências operacionais que sejam necessárias para uso seguro.
Reescrevê-las como orientação clínica direta, sem linguagem de bastidores. Exemplo:
substituir “validar apresentação com a instituição” por “usar a apresentação padronizada
pelo serviço e confirmar concentração antes da administração”.

Manter o dossiê técnico interno como arquivo separado e não o anexar automaticamente ao
produto público.

Antes de entregar, pesquisar no arquivo final os termos: `revis`, `auditor`, `IA`,
`pendente`, `valid`, `RH-`, `versão`, `editor`, `skill`, `agente` e `parecer`. Examinar
cada ocorrência e remover as que descrevam o processo de criação. Confirmar também:

- zero campos de formulário e zero widgets;
- zero comentários ou alterações controladas;
- nenhuma página de formulário;
- nenhum link para áreas de revisão;
- título, cabeçalho e rodapé próprios de publicação;
- metadados sem referências ao fluxo de revisão.
