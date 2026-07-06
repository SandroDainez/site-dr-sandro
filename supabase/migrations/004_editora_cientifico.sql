-- Editora Médica — modelagem do EDITOR CIENTÍFICO (texto científico a partir de
-- referências fornecidas). Espelha 003_editora_protocolos: geração → revisão →
-- publicação versionada e imutável, com auditoria de IA. Mudança ADITIVA: só cria
-- objetos novos e ADICIONA uma coluna a ai_generations. NÃO apaga nem altera nada de 003.
-- RLS espelhado de 001/002/003: leitura pública só do publicado; escrita service-role.
-- Reutiliza a função set_updated_at() já criada em 003.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) sci_docs (documento científico — cabeçalho editorial)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sci_docs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  specialty          TEXT NOT NULL DEFAULT 'geral'
                     CHECK (specialty IN ('emergencias','ti','anestesiologia','geral')),
  status             TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','scientific_review','ready_to_publish','published','archived')),
  stage              TEXT,                          -- módulo processando agora (ex.: 'editor-cientifico')
  current_version_id UUID,                          -- FK circular resolvida abaixo
  created_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) sci_versions (APPEND-ONLY; imutável quando is_published = true — ver §A)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sci_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id         UUID NOT NULL REFERENCES sci_docs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content        JSONB NOT NULL DEFAULT '{}',       -- corpo + afirmações/citações + referências
  is_published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doc_id, version_number)
);

-- §B) FK CIRCULAR: sci_docs.current_version_id -> sci_versions.id (após ambas existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sci_docs_current_version') THEN
    ALTER TABLE sci_docs
      ADD CONSTRAINT fk_sci_docs_current_version
      FOREIGN KEY (current_version_id) REFERENCES sci_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) ai_generations: reutilizada. Adiciona coluna ADITIVA para ligar a sci_versions
--    (não toca em protocol_version_id, usado pelo piloto). module_type distingue o módulo.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE ai_generations
  ADD COLUMN IF NOT EXISTS sci_version_id UUID REFERENCES sci_versions(id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) sci_sources (referências enviadas: texto real contra o qual as citações batem)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sci_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id      UUID NOT NULL REFERENCES sci_docs(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,                        -- guideline | artigo | livro | consenso ...
  title       TEXT,
  content     TEXT,                                 -- texto verificável (âncoras)
  metadata    JSONB DEFAULT '{}',
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sci_docs_status    ON sci_docs(status);
CREATE INDEX IF NOT EXISTS idx_sci_docs_specialty ON sci_docs(specialty);
CREATE INDEX IF NOT EXISTS idx_sci_versions_doc   ON sci_versions(doc_id, version_number);
CREATE INDEX IF NOT EXISTS idx_sci_versions_pub   ON sci_versions(is_published);
CREATE INDEX IF NOT EXISTS idx_aigen_sci_version  ON ai_generations(sci_version_id);
CREATE INDEX IF NOT EXISTS idx_sci_sources_doc    ON sci_sources(doc_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- §A) IMUTABILIDADE REAL de versões publicadas (mesma lógica de 003, tabela sci_versions).
--   Trigger BEFORE UPDATE OR DELETE: bloqueia mutação quando is_published = true.
--   Exceção: despublicar via unpublish_sci_version() (GUC 'app.allow_unpublish' local).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION protect_published_sci_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_published THEN
      RAISE EXCEPTION 'Versão publicada é imutável: DELETE não permitido (id=%).', OLD.id;
    END IF;
    RETURN OLD;
  END IF;

  -- TG_OP = 'UPDATE'
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
      RETURN NEW;  -- despublicação controlada
    END IF;
    RAISE EXCEPTION
      'Versão publicada é imutável: UPDATE bloqueado (id=%). Use unpublish_sci_version().', OLD.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_published_sci_version ON sci_versions;
CREATE TRIGGER trg_protect_published_sci_version
  BEFORE UPDATE OR DELETE ON sci_versions
  FOR EACH ROW EXECUTE FUNCTION protect_published_sci_version();

CREATE OR REPLACE FUNCTION unpublish_sci_version(p_version_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.allow_unpublish', 'on', TRUE);
  UPDATE sci_versions SET is_published = FALSE WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- updated_at automático em sci_docs (reutiliza set_updated_at() de 003)
DROP TRIGGER IF EXISTS trg_sci_docs_updated_at ON sci_docs;
CREATE TRIGGER trg_sci_docs_updated_at
  BEFORE UPDATE ON sci_docs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- §C) RLS. Público só vê publicado; sci_sources = zero acesso público.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE sci_docs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sci_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sci_sources  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sci_docs_public_select" ON sci_docs;
CREATE POLICY "sci_docs_public_select" ON sci_docs
  FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "sci_docs_service" ON sci_docs;
CREATE POLICY "sci_docs_service" ON sci_docs
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "sci_versions_public_select" ON sci_versions;
CREATE POLICY "sci_versions_public_select" ON sci_versions
  FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS "sci_versions_service" ON sci_versions;
CREATE POLICY "sci_versions_service" ON sci_versions
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "sci_sources_service" ON sci_sources;
CREATE POLICY "sci_sources_service" ON sci_sources
  FOR ALL USING (auth.role() = 'service_role');
