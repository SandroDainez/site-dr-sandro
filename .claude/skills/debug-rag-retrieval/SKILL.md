---
name: debug-rag-retrieval
description: Debuga falhas de retrieval no assistente clínico RAG do MedCampus. Use quando o problema for busca/recuperação de contexto (contexto errado, ausente ou incompleto), não quando o problema for a qualidade da resposta gerada a partir de um contexto correto.
---

# Arquitetura do RAG (MedCampus)

- Busca híbrida: BM25 + busca vetorial + RRF (reciprocal rank fusion)
- Reranking com cross-encoder após a fusão
- Revisor: DeepSeek, saída estruturada em JSON, atua como segunda camada de checagem

# Ordem de investigação (siga sempre nesta sequência)

1. **Classifique o problema primeiro**: é retrieval (contexto errado/ausente/incompleto
   chegando ao modelo) ou é geração (contexto correto, mas resposta ruim)?
   Isso muda completamente onde procurar — nunca pule esta etapa.

2. **Se for retrieval**, teste os componentes isoladamente antes de olhar o RRF:
   - BM25 sozinho: os termos-chave da pergunta batem com os documentos esperados?
   - Busca vetorial sozinha: os embeddings estão recuperando itens semanticamente
     próximos, mesmo sem match lexical?
   - Só depois de confirmar que ambos funcionam isoladamente, olhe o RRF combinado

3. **Verifique o reranking**: o cross-encoder pode estar descartando o chunk certo
   por ranking baixo mesmo que ele tenha sido recuperado corretamente antes.

4. **Só então olhe o revisor DeepSeek**: confirme se o JSON estruturado de saída
   está sendo parseado corretamente e se o prompt do revisor não está mascarando
   um problema de retrieval como se fosse de geração.

# Regra de ouro

Nunca assuma que é problema de prompt/geração antes de eliminar retrieval como causa.
A maioria dos "a IA respondeu errado" no MedCampus historicamente foi falha de
retrieval, não de geração.
