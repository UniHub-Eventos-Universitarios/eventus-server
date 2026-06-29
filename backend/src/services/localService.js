'use strict';
const { z } = require('zod');
const LocalModel = require('../models/localModel');
const ApiError = require('../utils/ApiError');

const TIPOS = ['sala', 'auditorio', 'laboratorio', 'externo'];

const createSchema = z.object({
  nome:       z.string().min(2, 'Nome obrigatorio'),
  tipo:       z.enum(TIPOS).optional(),
  andar:      z.string().optional(),
  capacidade: z.coerce.number().int().min(0).optional(),
  descricao:  z.string().optional(),
  mapa_x:     z.coerce.number().optional(),
  mapa_y:     z.coerce.number().optional(),
});
const updateSchema = createSchema.partial();

const LocalService = {
  list: (query) => LocalModel.findAll(query),
  mapa: () => LocalModel.findAllForMap(),

  async get(id) {
    const item = await LocalModel.findById(id);
    if (!item) throw ApiError.notFound('Local nao encontrado');
    return item;
  },

  create: (payload) => LocalModel.create(parse(createSchema, payload)),

  async update(id, payload) {
    await LocalService.get(id);
    return LocalModel.update(id, parse(updateSchema, payload));
  },

  async remove(id) {
    await LocalService.get(id);
    return LocalModel.remove(id);
  },
};

function parse(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw ApiError.badRequest('Dados invalidos', result.error.flatten().fieldErrors);
  }
  return result.data;
}

module.exports = LocalService;
