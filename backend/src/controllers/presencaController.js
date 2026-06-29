'use strict';
const service = require('../services/presencaService');
const asyncHandler = require('../utils/asyncHandler');

module.exports = {
  // POST /presencas  { atividade_id }
  marcar: asyncHandler(async (req, res) => {
    const atividadeId = Number(req.body.atividade_id);
    res.status(201).json(await service.marcar(req.user.id, atividadeId));
  }),

  // DELETE /presencas  { atividade_id }
  cancelar: asyncHandler(async (req, res) => {
    const atividadeId = Number(req.body.atividade_id);
    await service.cancelar(req.user.id, atividadeId);
    res.status(204).end();
  }),

  // GET /atividades/:id/presencas  (admin)
  porAtividade: asyncHandler(async (req, res) => {
    res.json(await service.porAtividade(Number(req.params.id)));
  }),

  // GET /auth/me/presencas  (usuario autenticado)
  minhas: asyncHandler(async (req, res) => {
    res.json(await service.porUsuario(req.user.id));
  }),
};
