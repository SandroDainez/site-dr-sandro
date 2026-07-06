-- Editora Médica — modelagem do CRIADOR DE FLASHCARDS (pares frente/verso a partir de
-- referências, com citações). NÃO reusa srs_cards (que é ESTADO de repetição espaçada por
-- usuário, não conteúdo). Espelha 003/004/005: geração → revisão → publicação versionada e
-- imutável, com auditoria de IA. ADITIVA. RLS: leitura pública só do publicado.
-- Reutiliza set_updated_at() de 003.

CREATE TABLE IF NOT EXISTS flashcard_docs (
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

CREATE TABLE IF NOT EXISTS flashcard_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id         UUID NOT NULL REFERENCES flashcard_docs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content        JSONB NOT NULL DEFAULT '{}',       -- cartões (frente/verso) + citações + referências
  is_published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doc_id, version_number)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_flashcard_docs_current_version') THEN
    ALTER TABLE flashcard_docs
      ADD CONSTRAINT fk_flashcard_docs_current_version
      FOREIGN KEY (current_version_id) REFERENCES flashcard_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE ai_generations
  ADD COLUMN IF NOT EXISTS flashcard_version_id UUID REFERENCES flashcard_versions(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS flashcard_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id      UUID NOT NULL REFERENCES flashcard_docs(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  title       TEXT,
  content     TEXT,
  metadata    JSONB DEFAULT '{}',
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcard_docs_status    ON flashcard_docs(status);
CREATE INDEX IF NOT EXISTS idx_flashcard_docs_specialty ON flashcard_docs(specialty);
CREATE INDEX IF NOT EXISTS idx_flashcard_versions_doc   ON flashcard_versions(doc_id, version_number);
CREATE INDEX IF NOT EXISTS idx_flashcard_versions_pub   ON flashcard_versions(is_published);
CREATE INDEX IF NOT EXISTS idx_aigen_flashcard_version  ON ai_generations(flashcard_version_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sources_doc    ON flashcard_sources(doc_id);

CREATE OR REPLACE FUNCTION protect_published_flashcard_version()
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
      'Versão publicada é imutável: UPDATE bloqueado (id=%). Use unpublish_flashcard_version().', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_published_flashcard_version ON flashcard_versions;
CREATE TRIGGER trg_protect_published_flashcard_version
  BEFORE UPDATE OR DELETE ON flashcard_versions
  FOR EACH ROW EXECUTE FUNCTION protect_published_flashcard_version();

CREATE OR REPLACE FUNCTION unpublish_flashcard_version(p_version_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.allow_unpublish', 'on', TRUE);
  UPDATE flashcard_versions SET is_published = FALSE WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_flashcard_docs_updated_at ON flashcard_docs;
CREATE TRIGGER trg_flashcard_docs_updated_at
  BEFORE UPDATE ON flashcard_docs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE flashcard_docs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sources  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flashcard_docs_public_select" ON flashcard_docs;
CREATE POLICY "flashcard_docs_public_select" ON flashcard_docs FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "flashcard_docs_service" ON flashcard_docs;
CREATE POLICY "flashcard_docs_service" ON flashcard_docs FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "flashcard_versions_public_select" ON flashcard_versions;
CREATE POLICY "flashcard_versions_public_select" ON flashcard_versions FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS "flashcard_versions_service" ON flashcard_versions;
CREATE POLICY "flashcard_versions_service" ON flashcard_versions FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "flashcard_sources_service" ON flashcard_sources;
CREATE POLICY "flashcard_sources_service" ON flashcard_sources FOR ALL USING (auth.role() = 'service_role');
