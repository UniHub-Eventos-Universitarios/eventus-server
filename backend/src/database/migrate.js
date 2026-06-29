'use strict';
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Defina DATABASE_URL no .env antes de rodar db:migrate');
  process.exit(1);
}

const schema = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(schema);
    console.log('Migracao concluida: tabelas e views criadas no Supabase.');
  } finally {
    await client.end().catch(() => {});
  }
}

run().catch((err) => {
  console.error('\n[ERRO] Nao foi possivel conectar ao banco via pg:', err.message);
  console.error('\nAlternativa: execute o SQL manualmente no Supabase SQL Editor.');
  console.error('Acesse: https://supabase.com/dashboard/project/lvgecwooshopqmhhhuns/sql/new');
  console.error('\nO schema completo esta em: backend/src/database/schema.sql');
  console.error('Para criar apenas a tabela participacoes, execute:\n');
  console.log(`
CREATE TABLE IF NOT EXISTS participacoes (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  evento_id   INTEGER NOT NULL REFERENCES eventos(id)  ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, evento_id)
);
CREATE INDEX IF NOT EXISTS idx_participacoes_usuario ON participacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_participacoes_evento  ON participacoes(evento_id);
`);
  process.exit(1);
});
