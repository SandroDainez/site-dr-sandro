-- Editora Médica — artigos/matérias editoriais (ver docs/PLANO-EDITORA.md).
-- Mudança ADITIVA: cria uma tabela nova, não toca em nada existente.
-- Padrão de RLS espelhado do 001: leitura pública só do publicado; escrita só service role.

CREATE TABLE IF NOT EXISTS editora_artigos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo         TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  resumo         TEXT DEFAULT '',
  corpo          TEXT DEFAULT '',                 -- HTML (texto rico)
  autor          TEXT DEFAULT '',                 -- crédito do autor (campo livre)
  especialidade  TEXT NOT NULL DEFAULT 'geral'
                 CHECK (especialidade IN ('emergencias','ti','anestesiologia','geral')),
  capa_url       TEXT DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'rascunho'
                 CHECK (status IN ('rascunho','publicado')),
  publicado_em   TIMESTAMPTZ,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artigos_pub          ON editora_artigos(status, publicado_em DESC);
CREATE INDEX IF NOT EXISTS idx_artigos_especialidade ON editora_artigos(especialidade);

-- RLS
ALTER TABLE editora_artigos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura publica artigos" ON editora_artigos;
CREATE POLICY "leitura publica artigos"
  ON editora_artigos FOR SELECT USING (status = 'publicado');

DROP POLICY IF EXISTS "service role artigos" ON editora_artigos;
CREATE POLICY "service role artigos"
  ON editora_artigos FOR ALL USING (auth.role() = 'service_role');
