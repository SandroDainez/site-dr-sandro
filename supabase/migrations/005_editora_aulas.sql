-- Editora Médica — modelagem do CRIADOR DE AULAS (aula em seções/slides a partir de
-- referências, com público-alvo). Espelha 003/004: geração → revisão → publicação
-- versionada e imutável, com auditoria de IA. ADITIVA: cria objetos novos e ADICIONA uma
-- coluna a ai_generations. NÃO altera 003/004. RLS: leitura pública só do publicado.
-- Reutiliza set_updated_at() de 003.

CREATE TABLE IF NOT EXISTS aula_docs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS aula_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id         UUID NOT NULL REFERENCES aula_docs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content        JSONB NOT NULL DEFAULT '{}',       -- slides/seções + público-alvo + citações + referências
  is_published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doc_id, version_number)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_aula_docs_current_version') THEN
    ALTER TABLE aula_docs
      ADD CONSTRAINT fk_aula_docs_current_version
      FOREIGN KEY (current_version_id) REFERENCES aula_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE ai_generations
  ADD COLUMN IF NOT EXISTS aula_version_id UUID REFERENCES aula_versions(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS aula_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id      UUID NOT NULL REFERENCES aula_docs(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  title       TEXT,
  content     TEXT,
  metadata    JSONB DEFAULT '{}',
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aula_docs_status    ON aula_docs(status);
CREATE INDEX IF NOT EXISTS idx_aula_docs_specialty ON aula_docs(specialty);
CREATE INDEX IF NOT EXISTS idx_aula_versions_doc   ON aula_versions(doc_id, version_number);
CREATE INDEX IF NOT EXISTS idx_aula_versions_pub   ON aula_versions(is_published);
CREATE INDEX IF NOT EXISTS idx_aigen_aula_version  ON ai_generations(aula_version_id);
CREATE INDEX IF NOT EXISTS idx_aula_sources_doc    ON aula_sources(doc_id);

CREATE OR REPLACE FUNCTION protect_published_aula_version()
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
      'Versão publicada é imutável: UPDATE bloqueado (id=%). Use unpublish_aula_version().', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_published_aula_version ON aula_versions;
CREATE TRIGGER trg_protect_published_aula_version
  BEFORE UPDATE OR DELETE ON aula_versions
  FOR EACH ROW EXECUTE FUNCTION protect_published_aula_version();

CREATE OR REPLACE FUNCTION unpublish_aula_version(p_version_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.allow_unpublish', 'on', TRUE);
  UPDATE aula_versions SET is_published = FALSE WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_aula_docs_updated_at ON aula_docs;
CREATE TRIGGER trg_aula_docs_updated_at
  BEFORE UPDATE ON aula_docs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE aula_docs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE aula_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aula_sources  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aula_docs_public_select" ON aula_docs;
CREATE POLICY "aula_docs_public_select" ON aula_docs FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "aula_docs_service" ON aula_docs;
CREATE POLICY "aula_docs_service" ON aula_docs FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "aula_versions_public_select" ON aula_versions;
CREATE POLICY "aula_versions_public_select" ON aula_versions FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS "aula_versions_service" ON aula_versions;
CREATE POLICY "aula_versions_service" ON aula_versions FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "aula_sources_service" ON aula_sources;
CREATE POLICY "aula_sources_service" ON aula_sources FOR ALL USING (auth.role() = 'service_role');
