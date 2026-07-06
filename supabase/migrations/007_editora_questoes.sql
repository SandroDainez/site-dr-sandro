-- Editora Médica — CRIADOR DE QUESTÕES (MCQ com gabarito + justificativa citada).
-- Casa própria com pipeline completo (sources, citações, confidence, versionamento imutável)
-- e, ao PUBLICAR, sincroniza (soft) com a tabela `questoes` do quiz. NÃO deleta em questoes
-- (srs_cards.questao_id é ON DELETE CASCADE → apagar questão apagaria progresso do usuário):
-- a sincronização usa ativo=false. Coluna aditiva editora_doc_id liga as linhas geradas ao doc.
-- Espelha 003-006. ADITIVA. RLS: leitura pública só do publicado. Reutiliza set_updated_at().

CREATE TABLE IF NOT EXISTS questao_docs (
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

CREATE TABLE IF NOT EXISTS questao_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id         UUID NOT NULL REFERENCES questao_docs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content        JSONB NOT NULL DEFAULT '{}',       -- questões (enunciado/opções/gabarito/justificativa citada) + referências
  is_published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doc_id, version_number)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_questao_docs_current_version') THEN
    ALTER TABLE questao_docs
      ADD CONSTRAINT fk_questao_docs_current_version
      FOREIGN KEY (current_version_id) REFERENCES questao_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE ai_generations
  ADD COLUMN IF NOT EXISTS questao_version_id UUID REFERENCES questao_versions(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS questao_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id      UUID NOT NULL REFERENCES questao_docs(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  title       TEXT,
  content     TEXT,
  metadata    JSONB DEFAULT '{}',
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coluna aditiva na tabela viva do quiz: liga uma linha de questoes ao doc da Editora que a
-- gerou (NULL para as questões criadas manualmente/legadas). Não altera nada existente.
ALTER TABLE questoes
  ADD COLUMN IF NOT EXISTS editora_doc_id UUID REFERENCES questao_docs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_questao_docs_status    ON questao_docs(status);
CREATE INDEX IF NOT EXISTS idx_questao_docs_specialty ON questao_docs(specialty);
CREATE INDEX IF NOT EXISTS idx_questao_versions_doc   ON questao_versions(doc_id, version_number);
CREATE INDEX IF NOT EXISTS idx_questao_versions_pub   ON questao_versions(is_published);
CREATE INDEX IF NOT EXISTS idx_aigen_questao_version  ON ai_generations(questao_version_id);
CREATE INDEX IF NOT EXISTS idx_questao_sources_doc    ON questao_sources(doc_id);
CREATE INDEX IF NOT EXISTS idx_questoes_editora_doc   ON questoes(editora_doc_id);

CREATE OR REPLACE FUNCTION protect_published_questao_version()
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
      'Versão publicada é imutável: UPDATE bloqueado (id=%). Use unpublish_questao_version().', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_published_questao_version ON questao_versions;
CREATE TRIGGER trg_protect_published_questao_version
  BEFORE UPDATE OR DELETE ON questao_versions
  FOR EACH ROW EXECUTE FUNCTION protect_published_questao_version();

CREATE OR REPLACE FUNCTION unpublish_questao_version(p_version_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.allow_unpublish', 'on', TRUE);
  UPDATE questao_versions SET is_published = FALSE WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_questao_docs_updated_at ON questao_docs;
CREATE TRIGGER trg_questao_docs_updated_at
  BEFORE UPDATE ON questao_docs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE questao_docs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE questao_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questao_sources  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questao_docs_public_select" ON questao_docs;
CREATE POLICY "questao_docs_public_select" ON questao_docs FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "questao_docs_service" ON questao_docs;
CREATE POLICY "questao_docs_service" ON questao_docs FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "questao_versions_public_select" ON questao_versions;
CREATE POLICY "questao_versions_public_select" ON questao_versions FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS "questao_versions_service" ON questao_versions;
CREATE POLICY "questao_versions_service" ON questao_versions FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "questao_sources_service" ON questao_sources;
CREATE POLICY "questao_sources_service" ON questao_sources FOR ALL USING (auth.role() = 'service_role');
