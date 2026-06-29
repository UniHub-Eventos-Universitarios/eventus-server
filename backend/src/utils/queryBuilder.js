'use strict';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

function parsePagination(query = {}) {
  let page = parseInt(query.page, 10);
  let perPage = parseInt(query.perPage ?? query.per_page, 10);

  if (!Number.isInteger(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isInteger(perPage) || perPage < 1) perPage = DEFAULT_PER_PAGE;
  if (perPage > MAX_PER_PAGE) perPage = MAX_PER_PAGE;

  return {
    page,
    perPage,
    limit: perPage,
    offset: (page - 1) * perPage,
  };
}

function parseSort(query = {}, allowedFields = [], defaultField, defaultDir = 'ASC') {
  let field = query.sort || defaultField || allowedFields[0];
  let dir = (query.order || '').toUpperCase();

  if (typeof field === 'string' && field.startsWith('-')) {
    field = field.slice(1);
    dir = dir || 'DESC';
  }

  if (!allowedFields.includes(field)) field = defaultField || allowedFields[0];
  if (dir !== 'ASC' && dir !== 'DESC') dir = defaultDir;

  return { field, dir, clause: `ORDER BY ${field} ${dir}` };
}

/**
 * Aplica filtros a uma query Supabase de forma encadeada.
 * Cada filtro: { column, value, operator }
 *   operator: '=' (padrao) | 'LIKE' | '>=' | '<='
 * Filtros com value undefined/null/'' sao ignorados.
 */
function applyFilters(query, filters = []) {
  for (const f of filters) {
    const v = f.value;
    if (v === undefined || v === null || v === '') continue;
    const op = f.operator || '=';
    if (op === 'LIKE') {
      query = query.ilike(f.column, `%${v}%`);
    } else if (op === '>=') {
      query = query.gte(f.column, v);
    } else if (op === '<=') {
      query = query.lte(f.column, v);
    } else {
      query = query.eq(f.column, v);
    }
  }
  return query;
}

/** Monta o envelope de resposta paginada padrao da API. */
function paginatedResult(data, total, pagination) {
  const totalPages = Math.max(1, Math.ceil(total / pagination.perPage));
  return {
    data,
    meta: {
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages,
      hasPrev: pagination.page > 1,
      hasNext: pagination.page < totalPages,
    },
  };
}

/**
 * Constrói cláusula WHERE e lista de parâmetros para SQL puro (SQLite/pg-raw).
 * Cada filtro: { column, value, operator }  operator: '=' (padrão) | 'LIKE' | '>=' | '<='
 * Filtros com value undefined/null/'' são ignorados.
 *
 * @returns {{ clause: string, params: any[] }}
 */
function buildWhere(filters = []) {
  const parts = [];
  const params = [];

  for (const f of filters) {
    const v = f.value;
    if (v === undefined || v === null || v === '') continue;
    const op = f.operator || '=';
    if (op === 'LIKE') {
      parts.push(`${f.column} LIKE ?`);
      params.push(`%${v}%`);
    } else if (op === '>=') {
      parts.push(`${f.column} >= ?`);
      params.push(v);
    } else if (op === '<=') {
      parts.push(`${f.column} <= ?`);
      params.push(v);
    } else {
      parts.push(`${f.column} = ?`);
      params.push(v);
    }
  }

  return {
    clause: parts.length ? `WHERE ${parts.join(' AND ')}` : '',
    params,
  };
}

module.exports = {
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  parsePagination,
  parseSort,
  applyFilters,
  buildWhere,
  paginatedResult,
};
