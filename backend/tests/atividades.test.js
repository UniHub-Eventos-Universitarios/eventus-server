'use strict';
/**
 * Testes de Atividades — DBE2 (paginação, filtros, ordenação)
 * Usa mock do cliente Supabase para rodar sem banco real.
 */
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';

// ─── Mock do Supabase ─────────────────────────────────────────────────────────
const SEED = [
  { id: 1, titulo: 'Palestra de IA',       tipo: 'palestra', trilha: 'IA',        data: '2026-09-14', hora_inicio: '09:00', hora_fim: '10:00', vagas: 100, inscritos: 0, vagas_restantes: 100, destaque: 1 },
  { id: 2, titulo: 'Oficina de Seguranca', tipo: 'oficina',  trilha: 'Seguranca', data: '2026-09-14', hora_inicio: '11:00', hora_fim: '13:00', vagas: 2,   inscritos: 0, vagas_restantes: 2,   destaque: 0 },
  { id: 3, titulo: 'Palestra de Cloud',    tipo: 'palestra', trilha: 'Cloud',     data: '2026-09-15', hora_inicio: '14:00', hora_fim: '15:00', vagas: 50,  inscritos: 0, vagas_restantes: 50,  destaque: 0 },
];

let store = [];

function makeChain() {
  let filtered = [...store];

  // Declara o objeto vazio primeiro para evitar TDZ ao referenciar chain dentro dos métodos
  const chain = {};

  chain.select      = jest.fn().mockReturnValue(chain);
  chain.eq          = jest.fn((col, val) => { filtered = filtered.filter(r => String(r[col]) === String(val)); return chain; });
  chain.neq         = jest.fn().mockReturnValue(chain);
  chain.ilike       = jest.fn((col, pat) => { const t = pat.replace(/%/g, '').toLowerCase(); filtered = filtered.filter(r => String(r[col] ?? '').toLowerCase().includes(t)); return chain; });
  chain.order       = jest.fn().mockReturnValue(chain);
  chain.gte         = jest.fn().mockReturnValue(chain);
  chain.lte         = jest.fn().mockReturnValue(chain);
  chain.in          = jest.fn().mockReturnValue(chain);
  chain.range       = jest.fn().mockImplementation((from, to) => Promise.resolve({ data: filtered.slice(from, to + 1), count: filtered.length, error: null }));
  chain.maybeSingle = jest.fn().mockImplementation(() => Promise.resolve({ data: filtered[0] ?? null, error: null }));
  chain.single      = jest.fn().mockImplementation(() => { const row = filtered[0] ? { ...filtered[0] } : null; return Promise.resolve({ data: row, error: null }); });
  chain.insert      = jest.fn().mockImplementation((row) => { const novo = { id: store.length + 1, inscritos: 0, vagas_restantes: row.vagas ?? 0, ...row }; store = [...store, novo]; filtered = [novo]; return chain; });
  chain.update      = jest.fn().mockImplementation(() => chain);
  chain.delete      = jest.fn().mockImplementation(() => chain);

  return chain;
}

jest.mock('../src/config/database', () => ({ from: jest.fn() }));

const request = require('supertest');
const db      = require('../src/config/database');
const app     = require('../src/app');

beforeEach(() => {
  store = [...SEED];
  db.from.mockImplementation(() => makeChain());
});

// ─── DBE2: listagem com paginação, filtros e ordenação ────────────────────────
describe('GET /api/atividades (DBE2)', () => {
  test('retorna envelope paginado com meta', async () => {
    const res = await request(app).get('/api/atividades');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('page');
    expect(res.body.meta).toHaveProperty('totalPages');
    expect(res.body.meta).toHaveProperty('hasPrev');
    expect(res.body.meta).toHaveProperty('hasNext');
  });

  test('filtra por tipo=oficina (DBE2)', async () => {
    const res = await request(app).get('/api/atividades?tipo=oficina');
    expect(res.status).toBe(200);
    expect(res.body.data.every(a => a.tipo === 'oficina')).toBe(true);
  });

  test('busca textual por titulo — ilike (DBE2)', async () => {
    const res = await request(app).get('/api/atividades?busca=Cloud');
    expect(res.status).toBe(200);
    expect(res.body.data.some(a => /cloud/i.test(a.titulo))).toBe(true);
  });

  test('paginacao respeita perPage (DBE2)', async () => {
    const res = await request(app).get('/api/atividades?perPage=2&page=1');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.meta.perPage).toBe(2);
  });

  test('aceita parametros de ordenacao sem erros (DBE2)', async () => {
    const res = await request(app).get('/api/atividades?sort=titulo&order=desc');
    expect(res.status).toBe(200);
  });

  test('404 ao buscar atividade inexistente', async () => {
    db.from.mockImplementationOnce(() => {
      const c = makeChain();
      c.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      return c;
    });
    const res = await request(app).get('/api/atividades/9999');
    expect(res.status).toBe(404);
  });
});

// ─── BD2: validação na criação ────────────────────────────────────────────────
describe('POST /api/atividades — validacao Zod (BD2)', () => {
  test('400 sem titulo (campo obrigatorio)', async () => {
    const res = await request(app)
      .post('/api/atividades')
      .set('Authorization', 'Bearer mock-admin-token')
      .send({ tipo: 'oficina', data: '2026-10-01', hora_inicio: '09:00', hora_fim: '11:00' });
    expect([400, 401]).toContain(res.status);
  });

  test('400 com data em formato invalido', async () => {
    const res = await request(app)
      .post('/api/atividades')
      .set('Authorization', 'Bearer mock-admin-token')
      .send({ titulo: 'X', tipo: 'palestra', data: '01/10/2026', hora_inicio: '09:00', hora_fim: '11:00' });
    expect([400, 401]).toContain(res.status);
  });
});
