'use strict';
const service = require('../services/usuarioService');
const asyncHandler = require('../utils/asyncHandler');

module.exports = {
  // POST /auth/register
  register: asyncHandler(async (req, res) => {
    const requestingRole = req.user?.role ?? null;
    const user = await service.register(req.body, requestingRole);
    res.status(201).json(user);
  }),

  // POST /auth/login
  login: asyncHandler(async (req, res) => {
    res.json(await service.login(req.body));
  }),

  // GET /auth/me
  me: asyncHandler(async (req, res) => {
    res.json(await service.me(req.user.id));
  }),

  // GET /admin/usuarios
  index: asyncHandler(async (req, res) => {
    res.json(await service.list(req.query));
  }),

  // PATCH /admin/usuarios/:id/role
  updateRole: asyncHandler(async (req, res) => {
    res.json(await service.updateRole(Number(req.params.id), req.body.role));
  }),

  // DELETE /admin/usuarios/:id
  destroy: asyncHandler(async (req, res) => {
    await service.remove(Number(req.params.id));
    res.status(204).end();
  }),
};
