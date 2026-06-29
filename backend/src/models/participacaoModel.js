'use strict';
const db = require('../config/database');

const fmtDate = (v) => (v ? String(v).slice(0, 10) : v);
const fmtTime = (v) => (v ? String(v).slice(0, 5) : v);

const ParticipacaoModel = {
  async findByEventoAndUsuario(eventoId, usuarioId) {
    const { data, error } = await db
      .from('participacoes')
      .select('*')
      .eq('evento_id', eventoId)
      .eq('usuario_id', usuarioId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  async create(usuarioId, eventoId) {
    const { data, error } = await db
      .from('participacoes')
      .insert({ usuario_id: usuarioId, evento_id: eventoId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(usuarioId, eventoId) {
    const { error } = await db
      .from('participacoes')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('evento_id', eventoId);
    if (error) throw error;
  },

  async countByEvento(eventoId) {
    const { count, error } = await db
      .from('participacoes')
      .select('*', { count: 'exact', head: true })
      .eq('evento_id', eventoId);
    if (error) throw error;
    return count ?? 0;
  },

  // Retorna todos os eventos que o usuario confirmou presenca, com horario para verificar conflito
  async findEventosByUsuario(usuarioId) {
    const { data, error } = await db
      .from('participacoes')
      .select('evento_id, eventos(id, titulo, data_inicio, data_fim, hora_inicio, hora_fim)')
      .eq('usuario_id', usuarioId);
    if (error) throw error;
    return (data ?? []).map((p) => ({
      id:          p.eventos?.id,
      titulo:      p.eventos?.titulo,
      data_inicio: fmtDate(p.eventos?.data_inicio),
      data_fim:    fmtDate(p.eventos?.data_fim),
      hora_inicio: fmtTime(p.eventos?.hora_inicio),
      hora_fim:    fmtTime(p.eventos?.hora_fim),
    }));
  },

  async listByEvento(eventoId) {
    const { data, error } = await db
      .from('participacoes')
      .select('*, usuarios(id, nome, email, role)')
      .eq('evento_id', eventoId)
      .order('created_at');
    if (error) throw error;
    return data ?? [];
  },

  async listByUsuario(usuarioId) {
    const { data, error } = await db
      .from('participacoes')
      .select('*, eventos(id, slug, titulo, data_inicio, data_fim, hora_inicio, hora_fim, status, categoria)')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};

module.exports = ParticipacaoModel;
