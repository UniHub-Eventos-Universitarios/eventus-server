'use strict';
const service = require('../services/participacaoService');
const asyncHandler = require('../utils/asyncHandler');

module.exports = {
  // GET /eventos/:id/participar  — verifica se o usuario autenticado participa
  status: asyncHandler(async (req, res) => {
    res.json(await service.status(req.user.id, Number(req.params.id)));
  }),

  // POST /eventos/:id/participar  — confirma presenca
  confirmar: asyncHandler(async (req, res) => {
    res.status(201).json(await service.confirmar(req.user.id, Number(req.params.id)));
  }),

  // DELETE /eventos/:id/participar  — cancela presenca
  cancelar: asyncHandler(async (req, res) => {
    await service.cancelar(req.user.id, Number(req.params.id));
    res.status(204).end();
  }),

  // GET /eventos/:id/participantes  — lista todos (admin)
  listarParticipantes: asyncHandler(async (req, res) => {
    res.json(await service.listarParticipantes(Number(req.params.id)));
  }),

  // GET /auth/me/eventos
  meusEventos: asyncHandler(async (req, res) => {
    res.json(await service.meusEventos(req.user.id));
  }),
};
