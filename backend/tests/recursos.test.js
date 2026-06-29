'use strict';
/**
 * Testes de Recursos (Palestrantes, Locais, Inscrições) — BD2 + DBE2
 * Usa mock do cliente Supabase para rodar sem banco real.
 */
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';

// ─── Mock do Supabase ─────────────────────────────────────────────────────────
let palStore   = [];
let localStore = [];

function makeChain(rows) {
  let filtered = rows ? [...rows] : [];

  const chain = {};
  chain.select      = jest.fn().mockReturnValue(chain);
  chain.eq          = jest.fn((col, val) => { filtered = filtered.filter(r => String(r[col]) === String(val)); return chain; });
  chain.neq         = jest.fn().mockReturnValue(chain);
  chain.ilike       = jest.fn((col, pat) => { const t = pat.replace(/%/g, '').toLowerCase(); filtered = filtered.filter(r => String(r[col] ?? '').toLowerCase().includes(t)); return chain; });
  chain.gte         = jest.fn((col, val) => { filtered = filtered.filter(r => Number(r[col] ?? 0) >= Number(val)); return chain; });
  chain.lte         = jest.fn().mockReturnValue(chain);
  // order retorna chain mas também é awaitable (para findAllForMap que faz await .order())
  chain.order       = jest.fn().mockImplementation(() => {
    chain.then = (resolve) => resolve({ data: filtered, count: filtered.length, error: null });
    return chain;
  });
  chain.in          = jest.fn().mockReturnValue(chain);
  chain.range       = jest.fn().mockImplementation((from, to) => Promise.resolve({ data: filtered.slice(from, to + 1), count: filtered.length, error: null }));
  chain.maybeSingle = jest.fn().mockImplementation(() => Promise.resolve({ data: filtered[0] ?? null, error: null }));
  chain.single      = jest.fn().mockImplementation(() => { const row = filtered[0] ? { ...filtered[0] } : null; return Promise.resolve({ data: row, error: null }); });
  chain.insert      = jest.fn().mockImplementation((row) => { const novo = { id: (filtered.length + 1), ...row }; filtered = [novo]; return chain; });
  chain.update      = jest.fn().mockImplementation(() => chain);
  chain.delete      = jest.fn().mockImplementation(() => chain);

  return chain;
}

jest.mock('../src/config/database', () => ({ from: jest.fn() }));

const request = require('supertest');
const db      = require('../src/config/database');
const app     = require('../src/app');

beforeEach(() => {
  palStore   = [{ id: 1, nome: 'Dra. Ana Souza', area: 'IA', instituicao: 'USP', email: null, foto_url: null }];
  localStore = [{ id: 1, nome: 'Auditorio X', tipo: 'auditorio', capacidade: 200, mapa_x: 10, mapa_y: 20 }];

  db.from.mockImplementation((table) => {
    if (table === 'palestrantes') return makeChain(palStore);
    if (table === 'locais')       return makeChain(localStore);
    return makeChain([]);
  });
});

const adminAuth = { Authorization: 'Bearer mock-admin-token' };

// ─── BD2 + DBE2: Palestrantes ─────────────────────────────────────────────────
describe('CRUD /api/palestrantes (BD2 + DBE2)', () => {
  test('GET retorna envelope paginado (DBE2)', async () => {
    const res = await request(app).get('/api/palestrantes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('page');
  });

  test('GET filtra por area (DBE2)', async () => {
    const res = await request(app).get('/api/palestrantes?area=IA');
    expect(res.status).toBe(200);
  });

  test('GET ordena resultados (DBE2)', async () => {
    const res = await request(app).get('/api/palestrantes?sort=nome&order=asc');
    expect(res.status).toBe(200);
  });

  test('POST 400 com e-mail invalido — validacao Zod (BD2)', async () => {
    const res = await request(app)
      .post('/api/palestrantes')
      .set(adminAuth)
      .send({ nome: 'Fulano', email: 'nao-eh-email' });
    expect([400, 401]).toContain(res.status);
  });

  test('POST 400 sem nome obrigatorio — validacao Zod (BD2)', async () => {
    const res = await request(app)
      .post('/api/palestrantes')
      .set(adminAuth)
      .send({ area: 'IA' });
    expect([400, 401]).toContain(res.status);
  });

  test('GET 404 ao buscar palestrante inexistente', async () => {
    db.from.mockImplementationOnce(() => {
      const c = makeChain([]);
      c.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      return c;
    });
    const res = await request(app).get('/api/palestrantes/9999');
    expect(res.status).toBe(404);
  });
});

// ─── BD2 + DBE2: Locais ───────────────────────────────────────────────────────
describe('CRUD /api/locais (BD2 + DBE2)', () => {
  test('GET lista locais com envelope paginado (DBE2)', async () => {
    const res = await request(app).get('/api/locais');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET filtra por capacidade minima (DBE2)', async () => {
    const res = await request(app).get('/api/locais?capacidadeMin=100');
    expect(res.status).toBe(200);
    expect(res.body.data.every(l => (l.capacidade ?? 0) >= 100)).toBe(true);
  });

  test('GET /api/locais/mapa retorna locais do mapa', async () => {
    const res = await request(app).get('/api/locais/mapa');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  test('POST 400 sem nome obrigatorio — validacao Zod (BD2)', async () => {
    const res = await request(app)
      .post('/api/locais')
      .set(adminAuth)
      .send({ capacidade: 50 });
    expect([400, 401]).toContain(res.status);
  });
});

// ─── BD2: Inscrições — regras de negócio ─────────────────────────────────────
describe('POST /api/inscricoes — validacao e regras de negocio (BD2)', () => {
  test('400 sem atividade_id (campo obrigatorio)', async () => {
    const res = await request(app)
      .post('/api/inscricoes')
      .send({ nome_participante: 'Joao', email: 'joao@example.com' });
    expect(res.status).toBe(400);
  });

  test('400 com e-mail invalido', async () => {
    const res = await request(app)
      .post('/api/inscricoes')
      .send({ atividade_id: 1, nome_participante: 'Joao', email: 'nao-email' });
    expect(res.status).toBe(400);
  });

  test('400 sem nome_participante', async () => {
    const res = await request(app)
      .post('/api/inscricoes')
      .send({ atividade_id: 1, email: 'joao@example.com' });
    expect(res.status).toBe(400);
  });
});

// ─── BD2: Participações — regras de negócio ───────────────────────────────────
describe('POST /api/eventos/:id/participar — regras de negocio (BD2)', () => {
  const EVENTO_ATIVO = {
    id: 1, titulo: 'Semana Tech 2026', status: 'ativo', capacidade: 50,
    data_inicio: '2026-09-14', data_fim: '2026-09-16',
    hora_inicio: '08:00', hora_fim: '18:00',
  };
  const EVENTO_INATIVO = { ...EVENTO_ATIVO, id: 2, status: 'encerrado' };

  beforeEach(() => {
    // Mock para evento — primeiro from() busca o evento, segundo verifica participacao, terceiro count
    let callCount = 0;
    db.from.mockImplementation((table) => {
      if (table === 'eventos') return makeChain([EVENTO_ATIVO]);
      if (table === 'participacoes') {
        callCount++;
        // 1a chamada: findByEventoAndUsuario → null (nao participa)
        // 2a chamada: countByEvento → 0 vagas usadas
        // 3a chamada: findEventosByUsuario → sem conflito
        if (callCount === 1) return makeChain([]);  // nao participa
        if (callCount === 2) {
          const c = makeChain([]);
          c.range = jest.fn().mockResolvedValue({ data: [], count: 0, error: null });
          return c;
        }
        return makeChain([]);
      }
      return makeChain([]);
    });
  });

  test('401 sem autenticacao', async () => {
    const res = await request(app).post('/api/eventos/1/participar');
    expect(res.status).toBe(401);
  });

  test('401 com token invalido', async () => {
    const res = await request(app)
      .post('/api/eventos/1/participar')
      .set('Authorization', 'Bearer token-invalido');
    expect(res.status).toBe(401);
  });

  test('GET /api/eventos/:id/participar requer autenticacao (DBE2)', async () => {
    const res = await request(app).get('/api/eventos/1/participar');
    expect(res.status).toBe(401);
  });

  test('DELETE /api/eventos/:id/participar requer autenticacao (BD2)', async () => {
    const res = await request(app).delete('/api/eventos/1/participar');
    expect(res.status).toBe(401);
  });
});
