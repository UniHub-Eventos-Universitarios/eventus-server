'use strict';
const PresencaModel = require('../models/presencaModel');
const AtividadeModel = require('../models/atividadeModel');
const ApiError = require('../utils/ApiError');

const PresencaService = {
  async marcar(usuarioId, atividadeId) {
    const atividade = await AtividadeModel.findById(atividadeId);
    if (!atividade) throw ApiError.notFound('Atividade nao encontrada');

    if (await PresencaModel.exists(usuarioId, atividadeId)) {
      throw ApiError.conflict('Presenca ja registrada para esta atividade');
    }

    return PresencaModel.create(usuarioId, atividadeId);
  },

  async cancelar(usuarioId, atividadeId) {
    const removido = await PresencaModel.remove(usuarioId, atividadeId);
    if (!removido) throw ApiError.notFound('Presenca nao encontrada');
    return true;
  },

  porAtividade: (atividadeId) => PresencaModel.findByAtividade(atividadeId),
  porUsuario:   (usuarioId)   => PresencaModel.findByUsuario(usuarioId),
};

module.exports = PresencaService;
