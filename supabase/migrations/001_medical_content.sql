-- Conteúdo médico automático (agentes de IA).
-- Rodar no SQL Editor do Supabase depois de criar o projeto (Fase E).

-- Atualizações clínicas semanais
CREATE TABLE IF NOT EXISTS medical_updates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  especialidade      TEXT NOT NULL CHECK (especialidade IN
                     ('anestesiologia','terapia_intensiva','emergencias')),
  titulo             TEXT NOT NULL,
  resumo             TEXT,
  topicos            JSONB DEFAULT '[]',
  fontes             JSONB DEFAULT '[]',
  semana_referencia  TEXT NOT NULL,
  data_publicacao    TIMESTAMPTZ DEFAULT NOW(),
  publicado          BOOLEAN DEFAULT TRUE,
  criado_em          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_updates_especialidade ON medical_updates(especialidade);
CREATE INDEX IF NOT EXISTS idx_updates_semana        ON medical_updates(semana_referencia);
CREATE INDEX IF NOT EXISTS idx_updates_pub           ON medical_updates(publicado, data_publicacao DESC);

-- Eventos científicos (congressos mundiais)
CREATE TABLE IF NOT EXISTS medical_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo              TEXT NOT NULL,
  descricao           TEXT,
  especialidades      TEXT[] NOT NULL,
  data_inicio         DATE NOT NULL,
  data_fim            DATE,
  local_nome          TEXT,
  cidade              TEXT,
  pais                TEXT NOT NULL DEFAULT 'Brasil',
  modalidade          TEXT CHECK (modalidade IN ('presencial','online','hibrido')),
  url_oficial         TEXT NOT NULL,
  organizador         TEXT,
  destaque            BOOLEAN DEFAULT FALSE,
  ativo               BOOLEAN DEFAULT TRUE,
  ultima_verificacao  TIMESTAMPTZ DEFAULT NOW(),
  criado_em           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_data           ON medical_events(data_inicio);
CREATE INDEX IF NOT EXISTS idx_events_especialidades ON medical_events USING GIN(especialidades);
CREATE INDEX IF NOT EXISTS idx_events_pais           ON medical_events(pais);
CREATE INDEX IF NOT EXISTS idx_events_ativo          ON medical_events(ativo, data_inicio);

-- RLS: leitura pública só do que está publicado/ativo; escrita só com service role.
ALTER TABLE medical_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_events  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura publica updates" ON medical_updates;
CREATE POLICY "leitura publica updates"
  ON medical_updates FOR SELECT USING (publicado = TRUE);

DROP POLICY IF EXISTS "leitura publica eventos" ON medical_events;
CREATE POLICY "leitura publica eventos"
  ON medical_events FOR SELECT
  USING (ativo = TRUE AND data_inicio >= CURRENT_DATE - INTERVAL '7 days');

DROP POLICY IF EXISTS "service role updates" ON medical_updates;
CREATE POLICY "service role updates"
  ON medical_updates FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role eventos" ON medical_events;
CREATE POLICY "service role eventos"
  ON medical_events FOR ALL USING (auth.role() = 'service_role');
