'use strict';
const { z } = require('zod');
const InscricaoModel = require('../models/inscricaoModel');
const AtividadeModel = require('../models/atividadeModel');
const ApiError = require('../utils/ApiError');

const STATUS = ['pendente', 'confirmada', 'cancelada'];

const createSchema = z.object({
  atividade_id:      z.coerce.number().int().positive(),
  nome_participante: z.string().min(2, 'Nome obrigatorio'),
  email:             z.string().email('E-mail invalido'),
  telefone:          z.string().optional(),
});

const updateSchema = z.object({
  nome_participante: z.string().min(2).optional(),
  email:             z.string().email().optional(),
  telefone:          z.string().optional(),
  status:            z.enum(STATUS).optional(),
});

const InscricaoService = {
  list: (query) => InscricaoModel.findAll(query),

  async get(id) {
    const item = await InscricaoModel.findById(id);
    if (!item) throw ApiError.notFound('Inscricao nao encontrada');
    return item;
  },

  async create(payload) {
    const data = parse(createSchema, payload);

    const atividade = await AtividadeModel.findById(data.atividade_id);
    if (!atividade) throw ApiError.badRequest('atividade_id inexistente');

    if (await InscricaoModel.existsForEmail(data.atividade_id, data.email)) {
      throw ApiError.conflict('Este e-mail ja esta inscrito nesta atividade');
    }

    if (atividade.vagas > 0) {
      const ocupadas = await InscricaoModel.countAtivasPorAtividade(data.atividade_id);
      if (ocupadas >= atividade.vagas) {
        throw ApiError.conflict('Nao ha vagas disponiveis para esta atividade');
      }
    }

    return InscricaoModel.create({ ...data, status: 'pendente' });
  },

  async update(id, payload) {
    await InscricaoService.get(id);
    return InscricaoModel.update(id, parse(updateSchema, payload));
  },

  async remove(id) {
    await InscricaoService.get(id);
    return InscricaoModel.remove(id);
  },
};

function parse(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw ApiError.badRequest('Dados invalidos', result.error.flatten().fieldErrors);
  }
  return result.data;
}

module.exports = InscricaoService;
