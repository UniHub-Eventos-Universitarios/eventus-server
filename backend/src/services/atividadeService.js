'use strict';
const { z } = require('zod');
const AtividadeModel = require('../models/atividadeModel');
const PalestranteModel = require('../models/palestranteModel');
const LocalModel = require('../models/localModel');
const ApiError = require('../utils/ApiError');

const TIPOS = ['palestra', 'oficina', 'mesa_redonda', 'minicurso'];
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

const baseSchema = z.object({
  titulo:         z.string().min(3, 'Titulo obrigatorio (min. 3 caracteres)'),
  descricao:      z.string().optional(),
  tipo:           z.enum(TIPOS).optional(),
  trilha:         z.string().optional(),
  palestrante_id: z.coerce.number().int().positive().optional().nullable(),
  local_id:       z.coerce.number().int().positive().optional().nullable(),
  data:           z.string().regex(DATA, 'Use o formato YYYY-MM-DD'),
  hora_inicio:    z.string().regex(HORA, 'Hora invalida (HH:MM)'),
  hora_fim:       z.string().regex(HORA, 'Hora invalida (HH:MM)'),
  vagas:          z.coerce.number().int().min(0).optional(),
  destaque:       z.coerce.boolean().optional(),
});

const horaCoerente = (d) =>
  !d.hora_inicio || !d.hora_fim || d.hora_fim > d.hora_inicio;

const createSchema = baseSchema.refine(horaCoerente, {
  message: 'hora_fim deve ser maior que hora_inicio',
  path: ['hora_fim'],
});

const updateSchema = baseSchema.partial().refine(horaCoerente, {
  message: 'hora_fim deve ser maior que hora_inicio',
  path: ['hora_fim'],
});

const AtividadeService = {
  list:      (query) => AtividadeModel.findAll(query),
  destaques: (limit) => AtividadeModel.destaques(limit),

  async get(id) {
    const item = await AtividadeModel.findById(id);
    if (!item) throw ApiError.notFound('Atividade nao encontrada');
    return item;
  },

  async create(payload) {
    const data = parse(createSchema, payload);
    await checkRelations(data);
    return AtividadeModel.create(data);
  },

  async update(id, payload) {
    await AtividadeService.get(id);
    const data = parse(updateSchema, payload);
    await checkRelations(data);
    return AtividadeModel.update(id, data);
  },

  async remove(id) {
    await AtividadeService.get(id);
    return AtividadeModel.remove(id);
  },
};

async function checkRelations(data) {
  if (data.palestrante_id && !(await PalestranteModel.findById(data.palestrante_id))) {
    throw ApiError.badRequest('palestrante_id inexistente');
  }
  if (data.local_id && !(await LocalModel.findById(data.local_id))) {
    throw ApiError.badRequest('local_id inexistente');
  }
}

function parse(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw ApiError.badRequest('Dados invalidos', result.error.flatten().fieldErrors);
  }
  return result.data;
}

module.exports = AtividadeService;
