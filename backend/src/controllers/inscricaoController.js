'use strict';
const service = require('../services/inscricaoService');
const asyncHandler = require('../utils/asyncHandler');

module.exports = {
  index:   asyncHandler(async (req, res) => res.json(await service.list(req.query))),
  show:    asyncHandler(async (req, res) => res.json(await service.get(Number(req.params.id)))),
  store:   asyncHandler(async (req, res) => res.status(201).json(await service.create(req.body))),
  update:  asyncHandler(async (req, res) => res.json(await service.update(Number(req.params.id), req.body))),
  destroy: asyncHandler(async (req, res) => {
    await service.remove(Number(req.params.id));
    res.status(204).end();
  }),
};
