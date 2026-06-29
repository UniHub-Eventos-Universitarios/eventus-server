'use strict';
const { z } = require('zod');
const PalestranteModel = require('../models/palestranteModel');
const ApiError = require('../utils/ApiError');

const createSchema = z.object({
  nome:       z.string().min(2, 'Nome obrigatorio (min. 2 caracteres)'),
  bio:        z.string().optional(),
  instituicao:z.string().optional(),
  area:       z.string().optional(),
  email:      z.string().email('E-mail invalido').optional().or(z.literal('')),
  foto_url:   z.string().url('URL invalida').optional().or(z.literal('')),
});
const updateSchema = createSchema.partial();

const PalestranteService = {
  list: (query) => PalestranteModel.findAll(query),

  async get(id) {
    const item = await PalestranteModel.findById(id);
    if (!item) throw ApiError.notFound('Palestrante nao encontrado');
    return item;
  },

  create: (payload) => PalestranteModel.create(parse(createSchema, payload)),

  async update(id, payload) {
    await PalestranteService.get(id);
    return PalestranteModel.update(id, parse(updateSchema, payload));
  },

  async remove(id) {
    await PalestranteService.get(id);
    return PalestranteModel.remove(id);
  },
};

function parse(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw ApiError.badRequest('Dados invalidos', result.error.flatten().fieldErrors);
  }
  return result.data;
}

module.exports = PalestranteService;
