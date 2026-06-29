'use strict';
const db = require('../config/database');

const UsuarioModel = {
  async findByEmail(email) {
    const { data, error } = await db.from('usuarios').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  },

  async findById(id) {
    const { data, error } = await db.from('usuarios').select('id,nome,email,role,created_at').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  },

  async create(data) {
    const { data: row, error } = await db.from('usuarios').insert({
      nome:       data.nome,
      email:      data.email,
      senha_hash: data.senha_hash,
      role:       data.role ?? 'aluno',
    }).select('id,nome,email,role,created_at').single();
    if (error) throw error;
    return row;
  },

  async findAll(query = {}) {
    let q = db.from('usuarios').select('id,nome,email,role,created_at', { count: 'exact' });
    if (query.role) q = q.eq('role', query.role);
    const { data, count, error } = await q.order('nome', { ascending: true });
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  },

  async updateRole(id, role) {
    const { data, error } = await db.from('usuarios').update({ role, updated_at: new Date().toISOString() })
      .eq('id', id).select('id,nome,email,role').single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { data, error } = await db.from('usuarios').delete().eq('id', id).select('id');
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },
};

module.exports = UsuarioModel;
