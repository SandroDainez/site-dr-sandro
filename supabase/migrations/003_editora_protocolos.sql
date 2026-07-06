-- Editora Médica — modelagem de PROTOCOLOS (núcleo: geração → revisão → publicação
-- versionada, com auditoria de IA e bibliografia). Ver docs/ARQUITETURA-IA.md e
-- docs/AUTH-ADMIN.md. Mudança ADITIVA: só cria tabelas/funções novas. NÃO apaga nada.
-- Padrão de RLS espelhado de 001/002: leitura pública só do publicado; escrita service-role.
-- Nota de nomenclatura: NÃO usamos "references" (palavra reservada) — a bibliografia é
-- `protocol_bibliography` e as citações da IA ficam em `ai_generations.citations`.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) protocols
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS protocols (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  specialty          TEXT NOT NULL DEFAULT 'geral'
                     CHECK (specialty IN ('emergencias','ti','anestesiologia','geral')),
  -- status editorial (fluxo de publicação)
  status             TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','scientific_review','ready_to_publish','published','archived')),
  -- stage = qual MÓDULO está processando agora (separado de status). Ex.: 'arquiteto-protocolos'.
  stage              TEXT,
  -- FK circular resolvida abaixo (nullable + ALTER após criar protocol_versions)
  current_version_id UUID,
  created_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) protocol_versions (APPEND-ONLY; imutável quando is_published = true — ver §A)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS protocol_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id    UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content        JSONB NOT NULL DEFAULT '{}',  -- corpo + afirmações/citações estruturadas
  is_published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (protocol_id, version_number)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- §B) FK CIRCULAR: protocols.current_version_id -> protocol_versions.id
--     Adicionada DEPOIS das duas tabelas existirem. Nullable + ON DELETE SET NULL.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_protocols_current_version'
  ) THEN
    ALTER TABLE protocols
      ADD CONSTRAINT fk_protocols_current_version
      FOREIGN KEY (current_version_id) REFERENCES protocol_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) ai_generations (auditoria de cada chamada de IA; custo, citações, confiança)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_generations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_version_id UUID REFERENCES protocol_versions(id) ON DELETE CASCADE,
  module_type         TEXT NOT NULL,               -- ex.: 'arquiteto-protocolos'
  provider            TEXT NOT NULL,               -- deepseek | openai | mock | anthropic
  model               TEXT NOT NULL,
  tokens_in           INTEGER NOT NULL DEFAULT 0,
  tokens_out          INTEGER NOT NULL DEFAULT 0,
  input               JSONB,
  output              JSONB,
  warnings            JSONB DEFAULT '[]',
  citations           JSONB DEFAULT '[]',          -- NÃO usar "references" (reservada)
  confidence_level    NUMERIC(4,3),                -- 0.000..1.000
  confidence_method   TEXT,                        -- ex.: 'deterministic+semantic'
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4a) protocol_sources (materiais enviados: texto real, metadados, tipo de origem)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS protocol_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,                       -- 'texto_colado' | 'pdf' | 'url' | 'diretriz' ...
  title       TEXT,
  content     TEXT,                                -- texto contra o qual as citações são verificadas
  metadata    JSONB DEFAULT '{}',
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4b) protocol_bibliography (bibliografia estruturada — evita o nome "references")
CREATE TABLE IF NOT EXISTS protocol_bibliography (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id   UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  source_id     UUID REFERENCES protocol_sources(id) ON DELETE SET NULL, -- liga à fonte, se houver
  citation_text TEXT,                              -- referência formatada (ex.: Vancouver)
  authors       TEXT,
  title         TEXT,
  journal       TEXT,
  year          INTEGER,
  doi           TEXT,
  pmid          TEXT,
  url           TEXT,
  ordering      INTEGER,                           -- ordem na lista
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Índices
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_protocols_status      ON protocols(status);
CREATE INDEX IF NOT EXISTS idx_protocols_specialty   ON protocols(specialty);
CREATE INDEX IF NOT EXISTS idx_versions_protocol     ON protocol_versions(protocol_id, version_number);
CREATE INDEX IF NOT EXISTS idx_versions_published    ON protocol_versions(is_published);
CREATE INDEX IF NOT EXISTS idx_aigen_version         ON ai_generations(protocol_version_id);
CREATE INDEX IF NOT EXISTS idx_sources_protocol      ON protocol_sources(protocol_id);
CREATE INDEX IF NOT EXISTS idx_biblio_protocol       ON protocol_bibliography(protocol_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- §A) IMUTABILIDADE REAL de versões publicadas.
--   Trigger BEFORE UPDATE OR DELETE: bloqueia mutação quando is_published = true.
--   ÚNICA exceção: despublicar (true -> false) via função controlada
--   unpublish_protocol_version(), que seta um flag transaction-local que o trigger
--   reconhece. Justificativa: o trigger roda SEMPRE (inclusive para service-role, que
--   ignora RLS mas NÃO ignora trigger) → imutabilidade real. Distinguir a despublicação
--   legítima de um UPDATE cru exige um sinal fora da linha (o GUC 'app.allow_unpublish'),
--   que só a função seta; e mesmo com o flag, o trigger valida que APENAS is_published
--   mudou (nenhum outro campo), impedindo "editar publicado disfarçado de despublicar".
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION protect_published_version()
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
       AND NEW.protocol_id    = OLD.protocol_id
       AND NEW.version_number = OLD.version_number
       AND NEW.content        IS NOT DISTINCT FROM OLD.content
       AND NEW.created_by     IS NOT DISTINCT FROM OLD.created_by
       AND NEW.created_at     = OLD.created_at
    THEN
      RETURN NEW;  -- despublicação controlada: permitida
    END IF;
    RAISE EXCEPTION
      'Versão publicada é imutável: UPDATE bloqueado (id=%). Use unpublish_protocol_version().', OLD.id;
  END IF;

  RETURN NEW;  -- versão ainda não publicada: livre
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_published_version ON protocol_versions;
CREATE TRIGGER trg_protect_published_version
  BEFORE UPDATE OR DELETE ON protocol_versions
  FOR EACH ROW EXECUTE FUNCTION protect_published_version();

-- Função controlada de DESPUBLICAÇÃO (única forma de mexer numa versão publicada).
CREATE OR REPLACE FUNCTION unpublish_protocol_version(p_version_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.allow_unpublish', 'on', TRUE); -- TRUE = local à transação
  UPDATE protocol_versions SET is_published = FALSE WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- updated_at automático em protocols
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protocols_updated_at ON protocols;
CREATE TRIGGER trg_protocols_updated_at
  BEFORE UPDATE ON protocols
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- §C) RLS em TODA tabela.
--   admin/servidor = service-role (acesso total; bypassa RLS, mas mantemos a policy
--   por clareza). Público (anon/usuário comum): só o publicado; rascunho nunca vaza.
--   ai_generations e protocol_sources: ZERO acesso público (sem policy de SELECT).
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE protocols            ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_sources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_bibliography ENABLE ROW LEVEL SECURITY;

-- protocols: público só vê status = 'published'
DROP POLICY IF EXISTS "protocols_public_select" ON protocols;
CREATE POLICY "protocols_public_select" ON protocols
  FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "protocols_service" ON protocols;
CREATE POLICY "protocols_service" ON protocols
  FOR ALL USING (auth.role() = 'service_role');

-- protocol_versions: público só vê is_published = true
DROP POLICY IF EXISTS "versions_public_select" ON protocol_versions;
CREATE POLICY "versions_public_select" ON protocol_versions
  FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS "versions_service" ON protocol_versions;
CREATE POLICY "versions_service" ON protocol_versions
  FOR ALL USING (auth.role() = 'service_role');

-- ai_generations: ZERO acesso público (só service-role)
DROP POLICY IF EXISTS "aigen_service" ON ai_generations;
CREATE POLICY "aigen_service" ON ai_generations
  FOR ALL USING (auth.role() = 'service_role');

-- protocol_sources: ZERO acesso público (só service-role)
DROP POLICY IF EXISTS "sources_service" ON protocol_sources;
CREATE POLICY "sources_service" ON protocol_sources
  FOR ALL USING (auth.role() = 'service_role');

-- protocol_bibliography: público só quando o protocolo está publicado
DROP POLICY IF EXISTS "biblio_public_select" ON protocol_bibliography;
CREATE POLICY "biblio_public_select" ON protocol_bibliography
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM protocols p WHERE p.id = protocol_id AND p.status = 'published')
  );
DROP POLICY IF EXISTS "biblio_service" ON protocol_bibliography;
CREATE POLICY "biblio_service" ON protocol_bibliography
  FOR ALL USING (auth.role() = 'service_role');
