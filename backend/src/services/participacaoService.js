'use strict';
const ParticipacaoModel = require('../models/participacaoModel');
const EventoModel = require('../models/eventoModel');
const ApiError = require('../utils/ApiError');

const ParticipacaoService = {
  async status(usuarioId, eventoId) {
    const p = await ParticipacaoModel.findByEventoAndUsuario(eventoId, usuarioId);
    return { participando: !!p };
  },

  async confirmar(usuarioId, eventoId) {
    const evento = await EventoModel.findById(eventoId);
    if (!evento) throw ApiError.notFound('Evento nao encontrado');

    if (evento.status !== 'ativo') {
      throw ApiError.badRequest('Este evento nao esta aceitando inscricoes');
    }

    // Verifica se o evento ja passou
    const dataFimStr  = String(evento.data_fim).slice(0, 10);
    const horaFimStr  = String(evento.hora_fim).slice(0, 5);
    const fimEvento   = new Date(`${dataFimStr}T${horaFimStr}:00`);
    if (new Date() > fimEvento) {
      throw ApiError.badRequest('Este evento ja foi encerrado');
    }

    // Ja participa?
    const jaParticipa = await ParticipacaoModel.findByEventoAndUsuario(eventoId, usuarioId);
    if (jaParticipa) throw ApiError.conflict('Voce ja confirmou presenca neste evento');

    // Vagas esgotadas?
    if (evento.capacidade > 0) {
      const total = await ParticipacaoModel.countByEvento(eventoId);
      if (total >= evento.capacidade) throw ApiError.conflict('Nao ha vagas disponiveis neste evento');
    }

    // Conflito de horario com outros eventos do usuario
    const dataInicioStr = String(evento.data_inicio).slice(0, 10);
    const horaInicioStr = String(evento.hora_inicio).slice(0, 5);

    const outrosEventos = await ParticipacaoModel.findEventosByUsuario(usuarioId);
    const conflito = outrosEventos.find((e) => {
      if (e.id === eventoId) return false;
      // Intervalos de datas se sobrepoe?
      const dataOverlap = e.data_inicio <= dataFimStr && e.data_fim >= dataInicioStr;
      // Intervalos de horario se sobrepoe?
      const horaOverlap = e.hora_inicio < horaFimStr && e.hora_fim > horaInicioStr;
      return dataOverlap && horaOverlap;
    });
    if (conflito) {
      throw ApiError.conflict(`Conflito de horario com "${conflito.titulo}"`);
    }

    return ParticipacaoModel.create(usuarioId, eventoId);
  },

  async cancelar(usuarioId, eventoId) {
    const p = await ParticipacaoModel.findByEventoAndUsuario(eventoId, usuarioId);
    if (!p) throw ApiError.notFound('Voce nao esta inscrito neste evento');
    await ParticipacaoModel.remove(usuarioId, eventoId);
  },

  async listarParticipantes(eventoId) {
    const evento = await EventoModel.findById(eventoId);
    if (!evento) throw ApiError.notFound('Evento nao encontrado');
    return ParticipacaoModel.listByEvento(eventoId);
  },

  async meusEventos(usuarioId) {
    return ParticipacaoModel.listByUsuario(usuarioId);
  },
};

module.exports = ParticipacaoService;
