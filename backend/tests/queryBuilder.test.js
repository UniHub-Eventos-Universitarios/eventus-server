'use strict';
const {
  parsePagination,
  parseSort,
  buildWhere,
  paginatedResult,
} = require('../src/utils/queryBuilder');

describe('queryBuilder (DBE2)', () => {
  describe('parsePagination', () => {
    test('usa valores padrao quando ausentes', () => {
      const p = parsePagination({});
      expect(p.page).toBe(1);
      expect(p.perPage).toBe(10);
      expect(p.offset).toBe(0);
    });

    test('calcula offset corretamente', () => {
      const p = parsePagination({ page: '3', perPage: '20' });
      expect(p.page).toBe(3);
      expect(p.perPage).toBe(20);
      expect(p.offset).toBe(40);
    });

    test('limita perPage ao maximo permitido', () => {
      expect(parsePagination({ perPage: '999' }).perPage).toBe(100);
    });

    test('ignora valores invalidos', () => {
      const p = parsePagination({ page: 'abc', perPage: '-5' });
      expect(p.page).toBe(1);
      expect(p.perPage).toBe(10);
    });
  });

  describe('parseSort', () => {
    const allowed = ['data', 'titulo'];

    test('aplica campo e direcao padrao', () => {
      const s = parseSort({}, allowed, 'data', 'ASC');
      expect(s.clause).toBe('ORDER BY data ASC');
    });

    test('aceita order=desc', () => {
      const s = parseSort({ sort: 'titulo', order: 'desc' }, allowed, 'data');
      expect(s.field).toBe('titulo');
      expect(s.dir).toBe('DESC');
    });

    test('aceita prefixo "-" para descendente', () => {
      const s = parseSort({ sort: '-titulo' }, allowed, 'data');
      expect(s.dir).toBe('DESC');
    });

    test('rejeita coluna fora da allowlist (anti-injection)', () => {
      const s = parseSort({ sort: 'titulo; DROP TABLE' }, allowed, 'data');
      expect(s.field).toBe('data');
    });
  });

  describe('buildWhere', () => {
    test('retorna clausula vazia sem filtros validos', () => {
      const r = buildWhere([{ column: 'tipo', value: undefined }]);
      expect(r.clause).toBe('');
      expect(r.params).toHaveLength(0);
    });

    test('monta LIKE com curingas', () => {
      const r = buildWhere([{ column: 'titulo', value: 'IA', operator: 'LIKE' }]);
      expect(r.clause).toBe('WHERE titulo LIKE ?');
      expect(r.params).toEqual(['%IA%']);
    });

    test('combina multiplos filtros com AND', () => {
      const r = buildWhere([
        { column: 'tipo', value: 'oficina' },
        { column: 'data', value: '2026-09-14', operator: '>=' },
      ]);
      expect(r.clause).toBe('WHERE tipo = ? AND data >= ?');
      expect(r.params).toEqual(['oficina', '2026-09-14']);
    });
  });

  describe('paginatedResult', () => {
    test('monta meta com totalPages e flags', () => {
      const r = paginatedResult([1, 2], 25, { page: 2, perPage: 10 });
      expect(r.meta.total).toBe(25);
      expect(r.meta.totalPages).toBe(3);
      expect(r.meta.hasPrev).toBe(true);
      expect(r.meta.hasNext).toBe(true);
    });
  });
});
