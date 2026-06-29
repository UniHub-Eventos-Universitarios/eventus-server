'use strict';
const db = require('../config/database');

const PresencaModel = {
  async findByAtividade(atividadeId) {
    const { data, error } = await db
      .from('presencas')
      .select('*, usuarios(id,nome,email,role)')
      .eq('atividade_id', atividadeId)
      .order('checked_at');
    if (error) throw error;
    return data ?? [];
  },

  async findByUsuario(usuarioId) {
    const { data, error } = await db
      .from('presencas')
      .select('*, atividades(id,titulo,tipo,data,hora_inicio,hora_fim,evento_id)')
      .eq('usuario_id', usuarioId)
      .order('checked_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async exists(usuarioId, atividadeId) {
    const { data, error } = await db
      .from('presencas')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('atividade_id', atividadeId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async create(usuarioId, atividadeId) {
    const { data, error } = await db.from('presencas')
      .insert({ usuario_id: usuarioId, atividade_id: atividadeId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(usuarioId, atividadeId) {
    const { data, error } = await db.from('presencas')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('atividade_id', atividadeId)
      .select('id');
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },
};

module.exports = PresencaModel;
