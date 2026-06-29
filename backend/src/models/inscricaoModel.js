'use strict';
const db = require('../config/database');
const { applyFilters, parseSort, parsePagination, paginatedResult } = require('../utils/queryBuilder');

const SORTABLE = ['id', 'nome_participante', 'status', 'created_at'];

const InscricaoModel = {
  async findAll(query = {}) {
    const pagination = parsePagination(query);
    const sort = parseSort(query, SORTABLE, 'created_at', 'DESC');

    let q = applyFilters(db.from('inscricoes_completas').select('*', { count: 'exact' }), [
      { column: 'nome_participante', value: query.busca,      operator: 'LIKE' },
      { column: 'status',            value: query.status,     operator: '=' },
      { column: 'atividade_id',      value: query.atividadeId,operator: '=' },
      { column: 'email',             value: query.email,      operator: '=' },
    ]);

    const { data, count, error } = await q
      .order(sort.field, { ascending: sort.dir === 'ASC' })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw error;
    return paginatedResult(data ?? [], count, pagination);
  },

  async findById(id) {
    const { data, error } = await db
      .from('inscricoes_completas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  },

  async countAtivasPorAtividade(atividadeId) {
    const { count, error } = await db
      .from('inscricoes')
      .select('*', { count: 'exact', head: true })
      .eq('atividade_id', atividadeId)
      .neq('status', 'cancelada');
    if (error) throw error;
    return count ?? 0;
  },

  async existsForEmail(atividadeId, email) {
    const { data, error } = await db
      .from('inscricoes')
      .select('id')
      .eq('atividade_id', atividadeId)
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async create(data) {
    const { data: row, error } = await db.from('inscricoes').insert({
      atividade_id:      data.atividade_id,
      nome_participante: data.nome_participante,
      email:             data.email,
      telefone:          data.telefone ?? null,
      status:            data.status ?? 'pendente',
    }).select('id').single();
    if (error) throw error;
    return this.findById(row.id);
  },

  async update(id, data) {
    const current = await db.from('inscricoes').select('*').eq('id', id).maybeSingle();
    if (current.error) throw current.error;
    if (!current.data) return null;
    const m = { ...current.data, ...data };
    const { error } = await db.from('inscricoes').update({
      nome_participante: m.nome_participante,
      email:             m.email,
      telefone:          m.telefone ?? null,
      status:            m.status,
      updated_at:        new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;
    return this.findById(id);
  },

  async remove(id) {
    const { data, error } = await db.from('inscricoes').delete().eq('id', id).select('id');
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },
};

module.exports = InscricaoModel;
