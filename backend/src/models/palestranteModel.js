'use strict';
const db = require('../config/database');
const { applyFilters, parseSort, parsePagination, paginatedResult } = require('../utils/queryBuilder');

const SORTABLE = ['id', 'nome', 'instituicao', 'area', 'created_at'];

const PalestranteModel = {
  async findAll(query = {}) {
    const pagination = parsePagination(query);
    const sort = parseSort(query, SORTABLE, 'nome', 'ASC');

    let q = applyFilters(db.from('palestrantes').select('*', { count: 'exact' }), [
      { column: 'nome',       value: query.busca,      operator: 'LIKE' },
      { column: 'area',       value: query.area,        operator: '=' },
      { column: 'instituicao',value: query.instituicao, operator: 'LIKE' },
    ]);

    const { data, count, error } = await q
      .order(sort.field, { ascending: sort.dir === 'ASC' })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw error;
    return paginatedResult(data, count, pagination);
  },

  async findById(id) {
    const { data, error } = await db.from('palestrantes').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  },

  async create(data) {
    const { data: row, error } = await db.from('palestrantes').insert({
      nome:       data.nome,
      bio:        data.bio ?? null,
      instituicao:data.instituicao ?? null,
      area:       data.area ?? null,
      email:      data.email ?? null,
      foto_url:   data.foto_url ?? null,
    }).select().single();
    if (error) throw error;
    return row;
  },

  async update(id, data) {
    const current = await this.findById(id);
    if (!current) return null;
    const m = { ...current, ...data };
    const { data: row, error } = await db.from('palestrantes').update({
      nome:       m.nome,
      bio:        m.bio ?? null,
      instituicao:m.instituicao ?? null,
      area:       m.area ?? null,
      email:      m.email ?? null,
      foto_url:   m.foto_url ?? null,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single();
    if (error) throw error;
    return row;
  },

  async remove(id) {
    const { data, error } = await db.from('palestrantes').delete().eq('id', id).select('id');
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },
};

module.exports = PalestranteModel;
