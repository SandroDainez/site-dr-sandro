-- Editora Médica — CRIADOR/ATUALIZADOR DE PROTOCOLOS (híbrido/retrieval) + CACHE de busca
-- compartilhado pelos módulos de retrieval (7,8,9). Busca biblioteca interna (kb_chunks) +
-- PubMed → evidências viram Source[] → mesmo pipeline anti-alucinação (citações/confidence).
-- ADITIVA. RLS: leitura pública só do publicado; cache só service-role. set_updated_at() de 003.

-- Cache de resultados de busca (evita rebuscar/repagar PubMed). TTL controlado no código.
CREATE TABLE IF NOT EXISTS retrieval_cache (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key  TEXT NOT NULL UNIQUE,     -- hash de (tema + params + fontes)
  results    JSONB NOT NULL DEFAULT '[]',
  meta       JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_retrieval_cache_key ON retrieval_cache(cache_key);
ALTER TABLE retrieval_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "retrieval_cache_service" ON retrieval_cache;
CREATE POLICY "retrieval_cache_service" ON retrieval_cache FOR ALL USING (auth.role() = 'service_role');

-- Relatório de atualização de um protocolo (delta citado sobre um protocolo publicado).
CREATE TABLE IF NOT EXISTS protocol_update_docs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id        UUID REFERENCES protocols(id) ON DELETE SET NULL, -- protocolo de origem
  title              TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  specialty          TEXT NOT NULL DEFAULT 'geral'
                     CHECK (specialty IN ('emergencias','ti','anestesiologia','geral')),
  status             TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','scientific_review','ready_to_publish','published','archived')),
  stage              TEXT,
  current_version_id UUID,
  created_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protocol_update_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id         UUID NOT NULL REFERENCES protocol_update_docs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content        JSONB NOT NULL DEFAULT '{}',   -- tema + evidências (snapshot) + seções (delta) + referências
  is_published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doc_id, version_number)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_update_docs_current_version') THEN
    ALTER TABLE protocol_update_docs
      ADD CONSTRAINT fk_update_docs_current_version
      FOREIGN KEY (current_version_id) REFERENCES protocol_update_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE ai_generations
  ADD COLUMN IF NOT EXISTS update_version_id UUID REFERENCES protocol_update_versions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_update_docs_status   ON protocol_update_docs(status);
CREATE INDEX IF NOT EXISTS idx_update_versions_doc  ON protocol_update_versions(doc_id, version_number);
CREATE INDEX IF NOT EXISTS idx_update_versions_pub  ON protocol_update_versions(is_published);
CREATE INDEX IF NOT EXISTS idx_aigen_update_version ON ai_generations(update_version_id);

CREATE OR REPLACE FUNCTION protect_published_update_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_published THEN
      RAISE EXCEPTION 'Versão publicada é imutável: DELETE não permitido (id=%).', OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.is_published THEN
    IF current_setting('app.allow_unpublish', true) = 'on'
       AND NEW.is_published = FALSE
       AND NEW.id             = OLD.id
       AND NEW.doc_id         = OLD.doc_id
       AND NEW.version_number = OLD.version_number
       AND NEW.content        IS NOT DISTINCT FROM OLD.content
       AND NEW.created_by     IS NOT DISTINCT FROM OLD.created_by
       AND NEW.created_at     = OLD.created_at
    THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION
      'Versão publicada é imutável: UPDATE bloqueado (id=%). Use unpublish_update_version().', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_published_update_version ON protocol_update_versions;
CREATE TRIGGER trg_protect_published_update_version
  BEFORE UPDATE OR DELETE ON protocol_update_versions
  FOR EACH ROW EXECUTE FUNCTION protect_published_update_version();

CREATE OR REPLACE FUNCTION unpublish_update_version(p_version_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.allow_unpublish', 'on', TRUE);
  UPDATE protocol_update_versions SET is_published = FALSE WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_docs_updated_at ON protocol_update_docs;
CREATE TRIGGER trg_update_docs_updated_at
  BEFORE UPDATE ON protocol_update_docs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE protocol_update_docs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_update_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "update_docs_public_select" ON protocol_update_docs;
CREATE POLICY "update_docs_public_select" ON protocol_update_docs FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "update_docs_service" ON protocol_update_docs;
CREATE POLICY "update_docs_service" ON protocol_update_docs FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "update_versions_public_select" ON protocol_update_versions;
CREATE POLICY "update_versions_public_select" ON protocol_update_versions FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS "update_versions_service" ON protocol_update_versions;
CREATE POLICY "update_versions_service" ON protocol_update_versions FOR ALL USING (auth.role() = 'service_role');
