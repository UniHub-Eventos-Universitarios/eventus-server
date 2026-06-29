'use strict';
const { z } = require('zod');
const EventoModel = require('../models/eventoModel');
const ApiError = require('../utils/ApiError');

const CATEGORIAS = ['Congresso', 'Simpósio', 'Oficina', 'Palestra', 'Seminário', 'Semana Acadêmica', 'Feira'];
const STATUS    = ['rascunho', 'ativo', 'encerrado', 'cancelado'];
const DATA      = /^\d{4}-\d{2}-\d{2}$/;
const HORA      = /^([01]\d|2[0-3]):[0-5]\d$/;

const baseSchema = z.object({
  slug:             z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug so pode ter letras minusculas, numeros e hifens'),
  titulo:           z.string().min(3),
  descricao:        z.string().optional(),
  descricao_longa:  z.string().optional(),
  categoria:        z.enum(CATEGORIAS).optional(),
  cursos:           z.array(z.string()).optional(),
  imagem_url:       z.string().url().optional().or(z.literal('')),
  data_inicio:      z.string().regex(DATA, 'Use YYYY-MM-DD'),
  data_fim:         z.string().regex(DATA, 'Use YYYY-MM-DD'),
  hora_inicio:      z.string().regex(HORA).optional(),
  hora_fim:         z.string().regex(HORA).optional(),
  local_id:         z.coerce.number().int().positive().optional().nullable(),
  local_detalhe:    z.string().optional(),
  mapa_url:         z.string().optional(),
  capacidade:       z.coerce.number().int().min(0).optional(),
  status:           z.enum(STATUS).optional(),
  tags:             z.array(z.string()).optional(),
  organizador_nome: z.string().optional(),
  organizador_email:z.string().email().optional().or(z.literal('')),
  destaque:         z.coerce.boolean().optional(),
});

const createSchema = baseSchema;
const updateSchema = baseSchema.partial();

const EventoService = {
  list: (query) => EventoModel.findAll(query),

  async get(slug) {
    const ev = await EventoModel.findBySlug(slug);
    if (!ev) throw ApiError.notFound('Evento nao encontrado');
    return ev;
  },

  async getById(id) {
    const ev = await EventoModel.findById(id);
    if (!ev) throw ApiError.notFound('Evento nao encontrado');
    return ev;
  },

  async create(payload) {
    const data = parse(createSchema, payload);
    if (data.data_fim < data.data_inicio) {
      throw ApiError.badRequest('data_fim nao pode ser anterior a data_inicio');
    }
    return EventoModel.create(data);
  },

  async update(id, payload) {
    await EventoService.getById(id);
    const data = parse(updateSchema, payload);
    return EventoModel.update(id, data);
  },

  async remove(id) {
    await EventoService.getById(id);
    return EventoModel.remove(id);
  },
};

function parse(schema, payload) {
  const r = schema.safeParse(payload);
  if (!r.success) throw ApiError.badRequest('Dados invalidos', r.error.flatten().fieldErrors);
  return r.data;
}

module.exports = EventoService;
