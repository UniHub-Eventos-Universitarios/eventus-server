-- ============================================================
-- Schema PostgreSQL — Eventus: Site de Eventos Academicos
-- Entidades: usuarios, palestrantes, locais, eventos,
--            atividades, inscricoes, presencas
-- Execute via: npm run db:migrate
-- ============================================================

-- Remove objetos na ordem correta (mais dependente primeiro)
DROP VIEW  IF EXISTS inscricoes_completas;
DROP VIEW  IF EXISTS atividades_completas;
DROP TABLE IF EXISTS participacoes CASCADE;
DROP TABLE IF EXISTS presencas   CASCADE;
DROP TABLE IF EXISTS inscricoes  CASCADE;
DROP TABLE IF EXISTS atividades  CASCADE;
DROP TABLE IF EXISTS eventos     CASCADE;
DROP TABLE IF EXISTS palestrantes CASCADE;
DROP TABLE IF EXISTS locais      CASCADE;
DROP TABLE IF EXISTS usuarios    CASCADE;

-- ============================================================
-- usuarios
-- ============================================================
CREATE TABLE usuarios (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'aluno', -- aluno | professor | admin
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- palestrantes
-- ============================================================
CREATE TABLE palestrantes (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  bio         TEXT,
  instituicao TEXT,
  area        TEXT,
  email       TEXT,
  foto_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- locais
-- ============================================================
CREATE TABLE locais (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'sala',  -- sala | auditorio | laboratorio | externo
  andar       TEXT,
  capacidade  INTEGER NOT NULL DEFAULT 0,
  descricao   TEXT,
  mapa_x      DOUBLE PRECISION,
  mapa_y      DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- eventos  (nivel superior: congresso, simposio, semana etc.)
-- ============================================================
CREATE TABLE eventos (
  id               SERIAL PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  titulo           TEXT NOT NULL,
  descricao        TEXT,
  descricao_longa  TEXT,
  categoria        TEXT NOT NULL DEFAULT 'Congresso',
  -- Congresso | Simposio | Oficina | Palestra | Seminario | Semana Academica | Feira
  cursos           TEXT[],
  imagem_url       TEXT,
  data_inicio      DATE NOT NULL,
  data_fim         DATE NOT NULL,
  hora_inicio      TIME NOT NULL DEFAULT '08:00',
  hora_fim         TIME NOT NULL DEFAULT '18:00',
  local_id         INTEGER REFERENCES locais(id) ON DELETE SET NULL,
  local_detalhe    TEXT,
  mapa_url         TEXT,
  capacidade       INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'rascunho',
  -- rascunho | ativo | encerrado | cancelado
  tags             TEXT[],
  organizador_nome  TEXT,
  organizador_email TEXT,
  destaque         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- atividades  (sessoes dentro de um evento)
-- ============================================================
CREATE TABLE atividades (
  id             SERIAL PRIMARY KEY,
  evento_id      INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
  titulo         TEXT NOT NULL,
  descricao      TEXT,
  tipo           TEXT NOT NULL DEFAULT 'palestra',
  -- palestra | oficina | mesa_redonda | minicurso
  trilha         TEXT,
  palestrante_id INTEGER REFERENCES palestrantes(id) ON DELETE SET NULL,
  local_id       INTEGER REFERENCES locais(id)       ON DELETE SET NULL,
  data           DATE NOT NULL,
  hora_inicio    TIME NOT NULL,
  hora_fim       TIME NOT NULL,
  vagas          INTEGER NOT NULL DEFAULT 0,
  destaque       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- inscricoes
-- ============================================================
CREATE TABLE inscricoes (
  id                SERIAL PRIMARY KEY,
  atividade_id      INTEGER NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  nome_participante TEXT NOT NULL,
  email             TEXT NOT NULL,
  telefone          TEXT,
  status            TEXT NOT NULL DEFAULT 'pendente',
  -- pendente | confirmada | cancelada
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (atividade_id, email)
);

-- ============================================================
-- presencas  (check-in de usuarios autenticados)
-- ============================================================
CREATE TABLE presencas (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id)   ON DELETE CASCADE,
  atividade_id INTEGER NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  checked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, atividade_id)
);

-- ============================================================
-- participacoes  (usuario confirmou presenca no evento)
-- ============================================================
CREATE TABLE participacoes (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  evento_id   INTEGER NOT NULL REFERENCES eventos(id)  ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, evento_id)
);

-- ============================================================
-- Indices
-- ============================================================
CREATE INDEX idx_participacoes_usuario ON participacoes(usuario_id);
CREATE INDEX idx_participacoes_evento  ON participacoes(evento_id);
CREATE INDEX idx_eventos_slug        ON eventos(slug);
CREATE INDEX idx_eventos_status      ON eventos(status);
CREATE INDEX idx_eventos_data_inicio ON eventos(data_inicio);
CREATE INDEX idx_atividades_evento   ON atividades(evento_id);
CREATE INDEX idx_atividades_data     ON atividades(data, hora_inicio);
CREATE INDEX idx_atividades_tipo     ON atividades(tipo);
CREATE INDEX idx_atividades_trilha   ON atividades(trilha);
CREATE INDEX idx_inscricoes_ativ     ON inscricoes(atividade_id);
CREATE INDEX idx_inscricoes_status   ON inscricoes(status);
CREATE INDEX idx_presencas_usuario   ON presencas(usuario_id);
CREATE INDEX idx_presencas_atividade ON presencas(atividade_id);

-- ============================================================
-- View: atividades com palestrante, local e inscritos
-- ============================================================
CREATE OR REPLACE VIEW atividades_completas AS
SELECT
  a.id,
  a.evento_id,
  a.titulo,
  a.descricao,
  a.tipo,
  a.trilha,
  a.palestrante_id,
  a.local_id,
  TO_CHAR(a.data, 'YYYY-MM-DD')      AS data,
  TO_CHAR(a.hora_inicio, 'HH24:MI')  AS hora_inicio,
  TO_CHAR(a.hora_fim,    'HH24:MI')  AS hora_fim,
  a.vagas,
  a.destaque,
  a.created_at,
  a.updated_at,
  p.nome       AS palestrante_nome,
  p.bio        AS palestrante_bio,
  p.instituicao AS palestrante_instituicao,
  p.foto_url   AS palestrante_foto_url,
  l.nome       AS local_nome,
  l.tipo       AS local_tipo,
  COALESCE(ic.inscritos, 0) AS inscritos
FROM atividades a
LEFT JOIN palestrantes p ON p.id = a.palestrante_id
LEFT JOIN locais       l ON l.id = a.local_id
LEFT JOIN (
  SELECT atividade_id, COUNT(*) AS inscritos
  FROM   inscricoes
  WHERE  status <> 'cancelada'
  GROUP  BY atividade_id
) ic ON ic.atividade_id = a.id;

-- ============================================================
-- View: inscricoes com titulo/data da atividade
-- ============================================================
CREATE OR REPLACE VIEW inscricoes_completas AS
SELECT
  i.id,
  i.atividade_id,
  i.nome_participante,
  i.email,
  i.telefone,
  i.status,
  i.created_at,
  i.updated_at,
  a.titulo                        AS atividade_titulo,
  TO_CHAR(a.data, 'YYYY-MM-DD')  AS atividade_data
FROM inscricoes i
LEFT JOIN atividades a ON a.id = i.atividade_id;
