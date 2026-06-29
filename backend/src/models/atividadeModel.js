'use strict';
const db = require('../config/database');
const { applyFilters, parseSort, parsePagination, paginatedResult } = require('../utils/queryBuilder');

const SORTABLE = ['data', 'titulo', 'tipo', 'trilha', 'vagas', 'hora_inicio'];

const AtividadeModel = {
  async findAll(query = {}) {
    const pagination = parsePagination(query);
    const sort = parseSort(query, SORTABLE, 'data', 'ASC');

    let q = applyFilters(db.from('atividades_completas').select('*', { count: 'exact' }), [
      { column: 'titulo',         value: query.busca,       operator: 'LIKE' },
      { column: 'tipo',           value: query.tipo,         operator: '=' },
      { column: 'trilha',         value: query.trilha,       operator: '=' },
      { column: 'palestrante_id', value: query.palestranteId,operator: '=' },
      { column: 'local_id',       value: query.localId,      operator: '=' },
      { column: 'data',           value: query.data,         operator: '=' },
      { column: 'data',           value: query.dataInicio,   operator: '>=' },
      { column: 'data',           value: query.dataFim,      operator: '<=' },
      { column: 'destaque',       value: query.destaque,     operator: '=' },
    ]);

    const { data, count, error } = await q
      .order(sort.field, { ascending: sort.dir === 'ASC' })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw error;
    return paginatedResult((data ?? []).map(serialize), count, pagination);
  },

  async findById(id) {
    const { data, error } = await db
      .from('atividades_completas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? serialize(data) : undefined;
  },

  async destaques(limit = 6) {
    const { data, error } = await db
      .from('atividades_completas')
      .select('*')
      .eq('destaque', true)
      .order('data', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(serialize);
  },

  async create(data) {
    const { data: row, error } = await db.from('atividades').insert({
      titulo:         data.titulo,
      descricao:      data.descricao ?? null,
      tipo:           data.tipo ?? 'palestra',
      trilha:         data.trilha ?? null,
      palestrante_id: data.palestrante_id ?? null,
      local_id:       data.local_id ?? null,
      data:           data.data,
      hora_inicio:    data.hora_inicio,
      hora_fim:       data.hora_fim,
      vagas:          data.vagas ?? 0,
      destaque:       data.destaque ?? false,
    }).select('id').single();
    if (error) throw error;
    return this.findById(row.id);
  },

  async update(id, data) {
    const current = await this.findById(id);
    if (!current) return null;
    const m = { ...current, ...data };
    const { error } = await db.from('atividades').update({
      titulo:         m.titulo,
      descricao:      m.descricao ?? null,
      tipo:           m.tipo,
      trilha:         m.trilha ?? null,
      palestrante_id: m.palestrante_id ?? null,
      local_id:       m.local_id ?? null,
      data:           m.data,
      hora_inicio:    m.hora_inicio,
      hora_fim:       m.hora_fim,
      vagas:          m.vagas,
      destaque:       m.destaque ?? false,
      updated_at:     new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;
    return this.findById(id);
  },

  async remove(id) {
    const { data, error } = await db.from('atividades').delete().eq('id', id).select('id');
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },
};

function serialize(row) {
  return {
    ...row,
    vagas:           Number(row.vagas),
    inscritos:       Number(row.inscritos ?? 0),
    vagas_restantes: Math.max(0, Number(row.vagas) - Number(row.inscritos ?? 0)),
  };
}

module.exports = AtividadeModel;
