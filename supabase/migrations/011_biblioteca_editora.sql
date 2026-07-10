-- Biblioteca da Editora ("banco 2") — índice único, populado automaticamente sempre que
-- QUALQUER um dos 7 pares doc/versão da Editora publica (protocols, sci_docs, aula_docs,
-- flashcard_docs, questao_docs, research_docs, protocol_update_docs). Permite reaproveitar
-- o que já foi produzido num módulo como fonte de outro (busca por texto simples — não é
-- RAG/embeddings, é um catálogo curado e pequeno). Mudança ADITIVA.
--
-- Distinta de kb_referencias/kb_chunks (biblioteca manual de livros/artigos que alimenta o
-- assistente de IA do site) — aqui é o conteúdo que a PRÓPRIA Editora já gerou e publicou.

CREATE TABLE IF NOT EXISTS biblioteca_editora (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo         TEXT NOT NULL, -- ex.: 'arquiteto-protocolos', 'editor-premium'
  tabela_origem  TEXT NOT NULL, -- ex.: 'protocols', 'sci_docs' (tabela física do doc)
  doc_id         UUID NOT NULL, -- id na tabela física (sem FK — tabela varia por linha)
  titulo         TEXT NOT NULL,
  slug           TEXT NOT NULL,
  url_publica    TEXT NOT NULL, -- ex.: '/protocolos/avc-isquemico'
  especialidade  TEXT NOT NULL DEFAULT 'geral',
  areas          TEXT[] NOT NULL DEFAULT '{}',
  texto          TEXT NOT NULL DEFAULT '', -- conteúdo consolidado, limpo, pronto pra reaproveitar
  publicado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tabela_origem, doc_id) -- upsert a cada (re)publicação; despublicar remove a linha
);

CREATE INDEX IF NOT EXISTS idx_biblioteca_editora_modulo ON biblioteca_editora (modulo);
CREATE INDEX IF NOT EXISTS idx_biblioteca_editora_areas ON biblioteca_editora USING GIN (areas);
-- Busca textual simples (título + corpo) — catálogo é pequeno, não precisa de embeddings.
CREATE INDEX IF NOT EXISTS idx_biblioteca_editora_busca ON biblioteca_editora
  USING GIN (to_tsvector('portuguese', titulo || ' ' || texto));

ALTER TABLE biblioteca_editora ENABLE ROW LEVEL SECURITY;

-- Ferramenta 100% interna do admin (auth = senha única, não Supabase auth) — zero acesso
-- público, igual ai_generations/protocol_sources.
DROP POLICY IF EXISTS "biblioteca_editora_service" ON biblioteca_editora;
CREATE POLICY "biblioteca_editora_service" ON biblioteca_editora
  FOR ALL USING (auth.role() = 'service_role');
