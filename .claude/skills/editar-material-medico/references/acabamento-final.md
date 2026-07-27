# Gate de acabamento da publicação

Aplicar a todo DOCX ou PDF público final. A aprovação científica não substitui esta
verificação editorial e visual.

## Arquitetura e entrega

- Abrir pela camada operacional quando o produto for destinado à consulta clínica:
  princípio central, algoritmo, metas, gatilhos, doses, reavaliação e destino.
- Em materiais assistenciais, confirmar a matriz do pacote operacional mínimo:
  metas, algoritmo visual, pós-intervenção, populações especiais e checklists anexos.
- Colocar fundamentação, controvérsias, populações especiais e estratégias avançadas
  depois da camada operacional.
- Entregar por padrão apenas o produto público principal nos formatos solicitados.
  Dossiê interno, guia autônomo e auditorias só acompanham a entrega quando pedidos.
- Explicar previamente quando uma decisão editorial produzir mais de um produto.
- Confirmar que o gate de
  [lapidacao-editorial.md](lapidacao-editorial.md) foi concluído antes da diagramação.

## Densidade e componentes clínicos

- Reprovar parágrafo que reúna várias decisões clínicas e obrigue leitura integral para
  localizar a conduta.
- Usar, quando úteis: `Quando suspeitar`, `Quando agir`, `Como agir`, `O que evitar`,
  `Como reavaliar` e `Quando escalar ou transferir`.
- Padronizar visualmente `ALERTA`, `ARMADILHA` e `PONTO PRÁTICO`; não deixar alerta
  crítico oculto em texto corrido.
- Usar `Fluxo operacional` como único rótulo para sequências decisórias.
- Avaliar fluxograma em toda sequência com três ou mais decisões dependentes, ramo de
  instabilidade, falha/resgate ou destino alternativo.
- Não considerar o algoritmo geral suficiente quando existirem sequências críticas
  independentes que ganhem clareza com fluxo próprio.
- Usar checkboxes reais ou `☐` em checklists executáveis.

## Português clínico e consistência

- Preferir termos brasileiros. Na primeira ocorrência, usar:
  `centro cirúrgico` ou `sala operatória`, não `OR`;
  `estabilizador pélvico (binder)`, podendo abreviar depois.
- Definir abreviações antes do primeiro uso e manter uma única forma ao longo do texto.
- Pesquisar termos estrangeiros e abreviações não definidos antes de publicar.
- Reiniciar listas numeradas em cada bloco independente. Reprovar sequências que
  continuem a numeração de um algoritmo anterior. Quando a ordem não for essencial,
  preferir marcadores.

## Tabelas e alertas

- Definir larguras fixas pelo conteúdo, não dividir colunas igualmente.
- Evitar que rótulos curtos quebrem de modo desconfortável, especialmente
  `Hemocomponentes`, doses, unidades, siglas e palavras isoladas.
- Se um rótulo não couber, nesta ordem: ampliar a coluna, reduzir texto, usar quebra
  semântica deliberada e somente então reduzir discretamente a fonte.
- Não permitir quebra de palavra por letra ou sílaba em células estreitas.
- Transformar orientações operacionais críticas em alerta visual próprio, curto e
  próximo da conduta. Exemplo: incompatibilidade de cálcio e hemocomponentes na mesma
  via.
- Conferir cada tabela a 100% de zoom; contato de páginas não substitui essa inspeção.

## Cabeçalho MedCampus

- O arquivo do logo já contém o nome MedCampus. Não acrescentar uma segunda marca
  textual grande ou competitiva ao lado.
- Manter o logo visível, preservando proporção. Se houver texto auxiliar `MEDCAMPUS`,
  usar no máximo 6 pt, sem negrito e em cinza neutro.
- Reservar geometricamente a faixa do cabeçalho: o limite inferior do logo deve ficar
  acima do início da área de texto, com pelo menos 6 mm de respiro visual.
- Não usar apenas espaçamento do parágrafo do cabeçalho como proteção. Configurar
  margem superior, distância do cabeçalho e altura do logo de forma compatível.
- Inspecionar uma página inicial, uma página interna com título no topo e a última
  página em tamanho real. Reprovar qualquer título que pareça colado ao cabeçalho.

## Paginação e renderização

- Renderizar o DOCX para PDF e PNG após a última alteração.
- Ordenar páginas numericamente ao criar contatos (`1, 2, 3`, não `1, 10, 11`).
- Inspecionar todas as páginas e abrir em tamanho real páginas com tabelas, transições,
  títulos no topo, referências e conteúdo visualmente denso.
- Reprovar:
  - página vazia ou contendo apenas cabeçalho/rodapé;
  - página quase vazia causada por quebra manual, `keep_with_next` ou tabela;
  - título órfão, linha isolada ou seção iniciada após grande espaço sem finalidade;
  - sobreposição, corte, texto fora da margem ou quebra visual ruim;
  - cabeçalho diferente entre Word, PDF e visualizador final.
- Evitar quebra manual de página antes de título com `keep_with_next` sem testar o
  efeito combinado.
- Executar `scripts/validar_publicacao.py FINAL.pdf`. O script deve aprovar antes da
  entrega. Páginas essencialmente visuais exigem inspeção humana documentada.

## Controle de versão e cache

- Quando substituir um arquivo já baixado ou visualizado, criar nova versão nominal
  (`v1.1`, `v1.2`) se houver risco de cache.
- Não afirmar que o usuário abriu arquivo antigo sem antes comparar evidências visuais
  com a versão entregue. Preferir fornecer uma nova versão inequívoca.

## Checklist final

- [ ] Produto público principal identificado.
- [ ] Somente formatos solicitados preparados para entrega.
- [ ] Termos brasileiros e abreviações uniformes.
- [ ] Listas reiniciadas corretamente.
- [ ] Tabelas legíveis, sem quebras desconfortáveis.
- [ ] Alertas críticos destacados.
- [ ] Alertas, armadilhas e pontos práticos seguem taxonomia única.
- [ ] Sequências decisórias foram avaliadas para fluxograma.
- [ ] Algoritmo visual de síntese incluído quando aplicável.
- [ ] Algoritmos adicionais cobrem os caminhos críticos selecionados no gate.
- [ ] Quadro de metas incluído ou marcado como não aplicável no controle interno.
- [ ] Pós-intervenção e populações especiais foram avaliados.
- [ ] Checklists executáveis usam caixas reais e uma ação por item.
- [ ] Folha destacável ocupa uma página autônoma, legível e contém apenas os checklists prioritários.
- [ ] Copydesk final verificou espaços duplos, travessões, siglas, hifenização, capitalização e nomenclatura.
- [ ] Chamadas numéricas correspondem à bibliografia, estão em ordem e não há referência órfã.
- [ ] Toda nova citação foi verificada individualmente contra a afirmação correspondente.
- [ ] Toda linha farmacológica operacional foi conferida quanto a dose, unidade, via,
      duração, descritor de peso, contraindicações, monitorização e Brasil, conforme aplicável.
- [ ] O bloco de governança informa versão, datas, estado editorial, limites e
      dependências locais sem atribuir aprovação ou responsável não confirmados.
- [ ] Logo preservado; texto auxiliar discreto; respiro ≥6 mm.
- [ ] Nenhuma página vazia ou quase vazia.
- [ ] Nenhum campo, widget, comentário ou marca de revisão.
- [ ] Todas as páginas inspecionadas; páginas críticas abertas a 100%.
- [ ] PDF aprovado pelo validador automático.
