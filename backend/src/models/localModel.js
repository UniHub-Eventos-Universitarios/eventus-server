'use strict';
const db = require('../config/database');
const { applyFilters, parseSort, parsePagination, paginatedResult } = require('../utils/queryBuilder');

const SORTABLE = ['id', 'nome', 'tipo', 'capacidade', 'andar'];

const LocalModel = {
  async findAll(query = {}) {
    const pagination = parsePagination(query);
    const sort = parseSort(query, SORTABLE, 'nome', 'ASC');

    let q = applyFilters(db.from('locais').select('*', { count: 'exact' }), [
      { column: 'nome',       value: query.busca,       operator: 'LIKE' },
      { column: 'tipo',       value: query.tipo,         operator: '=' },
      { column: 'capacidade', value: query.capacidadeMin, operator: '>=' },
    ]);

    const { data, count, error } = await q
      .order(sort.field, { ascending: sort.dir === 'ASC' })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw error;
    return paginatedResult(data, count, pagination);
  },

  async findAllForMap() {
    const { data, error } = await db.from('locais').select('*').order('nome', { ascending: true });
    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await db.from('locais').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  },

  async create(data) {
    const { data: row, error } = await db.from('locais').insert({
      nome:       data.nome,
      tipo:       data.tipo ?? 'sala',
      andar:      data.andar ?? null,
      capacidade: data.capacidade ?? 0,
      descricao:  data.descricao ?? null,
      mapa_x:     data.mapa_x ?? null,
      mapa_y:     data.mapa_y ?? null,
    }).select().single();
    if (error) throw error;
    return row;
  },

  async update(id, data) {
    const current = await this.findById(id);
    if (!current) return null;
    const m = { ...current, ...data };
    const { data: row, error } = await db.from('locais').update({
      nome:       m.nome,
      tipo:       m.tipo ?? 'sala',
      andar:      m.andar ?? null,
      capacidade: m.capacidade ?? 0,
      descricao:  m.descricao ?? null,
      mapa_x:     m.mapa_x ?? null,
      mapa_y:     m.mapa_y ?? null,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single();
    if (error) throw error;
    return row;
  },

  async remove(id) {
    const { data, error } = await db.from('locais').delete().eq('id', id).select('id');
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },
};

module.exports = LocalModel;
