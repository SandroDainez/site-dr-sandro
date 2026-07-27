# Padrão obrigatório do pacote de revisão médica humana

## Regra central

Usar como referência normativa o sistema consolidado em:

`MedCampus — Choque no trauma — Revisão Humana v0.5`.

Não reinterpretar o padrão como mera inspiração. Reproduzir arquitetura, hierarquia,
paleta, densidade, navegação, campos e proporções. Alterar apenas título, identificação
do projeto, quantidade de pontos e conteúdo clínico.

## Arquitetura obrigatória

O pacote deve conter, nesta ordem:

1. material clínico com destaques `RH-*` inseridos no fluxo e sem sobreposição;
2. página de registro do revisor;
3. página de resumo clicável das decisões;
4. uma página padronizada para cada decisão;
5. página de confirmação final.

Não anexar formulário minimalista, formulário de planilha ou página composta apenas por
título, opções e caixa vazia.

## Tokens visuais fixos

- Formato: A4 retrato.
- Logo: canto superior esquerdo, visível, preservando proporção e respiro.
- Cabeçalho de formulário: texto em verde-azulado, alinhado à direita, com filete claro.
- Rodapé: nome do produto, versão para revisão e identificação da página/decisão.
- Fonte: Helvetica/Arial ou equivalente métrico consistente.
- Títulos: azul-marinho.
- Identificadores e elementos de decisão: vermelho escuro.
- Caixas informativas e resumo: verde-azulado muito claro.
- Cartão de decisão: rosa claro.
- Campo de resposta: branco, borda verde-azulada clara.

Paleta de referência:

- azul-marinho: `#073B4C`;
- verde-azulado: `#0B7A75`;
- fundo informativo: `#EAF6F5`;
- fundo de decisão: `#FDE8E8`;
- vermelho: `#B42318`;
- cinza: `#56616A`;
- linhas e bordas: `#BED9D7`.

## Registro do revisor

Incluir:

- nome;
- especialidade;
- instituição;
- data;
- instruções de preenchimento e devolução.

Usar campos alinhados e bloco instrucional em fundo verde-azulado claro. Não deixar a
página sem orientação operacional.

## Resumo clicável

Incluir todos os IDs em linhas compactas, com:

- ID;
- título curto;
- link interno para a página correspondente.

O resumo deve caber preferencialmente em uma página. Se houver muitos pontos, dividir
em páginas consecutivas mantendo o mesmo cabeçalho.

## Página de decisão

Cada ponto deve ser autossuficiente e conter dentro de um cartão rosado:

1. `RH-XX | TÍTULO`;
2. **O que observar** — contexto atual, divergência, disponibilidade ou escolha;
3. **O que você precisa decidir** — decisão clínica/editorial concreta;
4. **Como responder** — o que escrever se modificar;
5. grupo exclusivo:
   - Manter sem alteração;
   - Modificar;
   - Retirar;
6. rótulo específico do campo, por exemplo:
   `Escreva a redação, meta, dose, condição ou fluxo desejado`;
7. campo multilinha proporcional ao conteúdo restante.

Não usar frases genéricas como “consulte o capítulo e registre sua decisão”. Não obrigar
o revisor a procurar o significado do ponto em outra página para compreender a decisão.

## Geometria da página de decisão

- Margem lateral do cartão: aproximadamente 30 pt.
- Margem interna: aproximadamente 14 pt.
- Cartão: ocupar a maior parte útil da página, sem encostar em cabeçalho ou rodapé.
- Título e blocos contextuais: parte superior do cartão.
- Opções: linha compacta abaixo de “Como responder”.
- Campo narrativo: ocupar somente o espaço restante, com altura mínima suficiente para
  revisão, sem dominar a página quando o contexto for curto.

O campo não deve começar imediatamente após o título nem ocupar quase toda a folha.

## Confirmação final

Incluir:

- parecer global exclusivo:
  - Aprovar sem alterações;
  - Aprovar com ajustes;
  - Solicitar nova revisão;
- observações gerais;
- confirmação de que todos os pontos foram analisados;
- orientação sobre devolução e reauditoria focal.

## Requisitos funcionais

- AcroForm real.
- Grupo de rádio exclusivo por decisão.
- Campo multilinha com quebra e rolagem.
- Nenhum `/MaxLen` nos campos narrativos.
- Aparência `/AP /N` não vazia em todos os widgets.
- Árvore canônica `/AcroForm/Fields` coerente com os widgets.
- Links internos funcionais no resumo.
- Texto de teste com mais de 1.000 caracteres preservado após salvar, fechar e reabrir.

## Gate visual obrigatório

Renderizar e inspecionar:

1. registro do revisor;
2. resumo clicável;
3. primeira decisão;
4. decisão intermediária com maior volume de texto;
5. última decisão;
6. confirmação final;
7. contato de todas as páginas.

Reprovar se houver:

- página dominada por espaço vazio sem função;
- cartão ausente;
- campo excessivamente grande;
- contexto genérico ou incompleto;
- logo pequeno, sobreposto ou ausente;
- opções desalinhadas;
- texto cortado;
- diferenças visuais não justificadas em relação ao padrão;
- links ou campos não funcionais.

## Controle contra deriva

Antes de criar um novo pacote:

1. localizar o último pacote MedCampus aprovado para revisão humana;
2. renderizar páginas representativas;
3. copiar os tokens e a arquitetura;
4. alterar somente conteúdo e metadados;
5. comparar novamente antes da entrega.

Se houver conflito entre liberdade de design e este padrão, este padrão prevalece.
