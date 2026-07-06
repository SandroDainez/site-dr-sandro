-- Editora Médica — tabela COMPARTILHADA dos módulos de retrieval-síntese (#8 Comparador,
-- #9 Pesquisador). Mesma forma: busca -> documento citado. tipo distingue o módulo.
-- ADITIVA. RLS: leitura pública só do publicado. Reutiliza set_updated_at() de 003.
CREATE TABLE IF NOT EXISTS research_docs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo               TEXT NOT NULL CHECK (tipo IN ('comparador','pesquisador')),
  title              TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  tema               TEXT,
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

CREATE TABLE IF NOT EXISTS research_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id         UUID NOT NULL REFERENCES research_docs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content        JSONB NOT NULL DEFAULT '{}',
  is_published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doc_id, version_number)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_research_docs_current_version') THEN
    ALTER TABLE research_docs
      ADD CONSTRAINT fk_research_docs_current_version
      FOREIGN KEY (current_version_id) REFERENCES research_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE ai_generations
  ADD COLUMN IF NOT EXISTS research_version_id UUID REFERENCES research_versions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_research_docs_status   ON research_docs(status);
CREATE INDEX IF NOT EXISTS idx_research_docs_tipo     ON research_docs(tipo);
CREATE INDEX IF NOT EXISTS idx_research_versions_doc  ON research_versions(doc_id, version_number);
CREATE INDEX IF NOT EXISTS idx_research_versions_pub  ON research_versions(is_published);
CREATE INDEX IF NOT EXISTS idx_aigen_research_version ON ai_generations(research_version_id);

CREATE OR REPLACE FUNCTION protect_published_research_version()
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
      'Versão publicada é imutável: UPDATE bloqueado (id=%). Use unpublish_research_version().', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_published_research_version ON research_versions;
CREATE TRIGGER trg_protect_published_research_version
  BEFORE UPDATE OR DELETE ON research_versions
  FOR EACH ROW EXECUTE FUNCTION protect_published_research_version();

CREATE OR REPLACE FUNCTION unpublish_research_version(p_version_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.allow_unpublish', 'on', TRUE);
  UPDATE research_versions SET is_published = FALSE WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_research_docs_updated_at ON research_docs;
CREATE TRIGGER trg_research_docs_updated_at
  BEFORE UPDATE ON research_docs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE research_docs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "research_docs_public_select" ON research_docs;
CREATE POLICY "research_docs_public_select" ON research_docs FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "research_docs_service" ON research_docs;
CREATE POLICY "research_docs_service" ON research_docs FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "research_versions_public_select" ON research_versions;
CREATE POLICY "research_versions_public_select" ON research_versions FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS "research_versions_service" ON research_versions;
CREATE POLICY "research_versions_service" ON research_versions FOR ALL USING (auth.role() = 'service_role');
