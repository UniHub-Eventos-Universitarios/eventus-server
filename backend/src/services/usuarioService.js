'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const UsuarioModel = require('../models/usuarioModel');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const ROLES = ['aluno', 'professor', 'admin'];

const registerSchema = z.object({
  nome:  z.string().min(2, 'Nome obrigatorio'),
  email: z.string().email('E-mail invalido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  role:  z.enum(ROLES).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

const UsuarioService = {
  async register(payload, requestingRole = null) {
    const data = parse(registerSchema, payload);

    // Somente admins podem criar outros admins/professores
    if (data.role && data.role !== 'aluno' && requestingRole !== 'admin') {
      throw ApiError.forbidden('Apenas admins podem atribuir este perfil');
    }

    if (await UsuarioModel.findByEmail(data.email)) {
      throw ApiError.conflict('E-mail ja cadastrado');
    }

    const senha_hash = await bcrypt.hash(data.senha, 10);
    return UsuarioModel.create({ ...data, senha_hash });
  },

  async login(payload) {
    const data = parse(loginSchema, payload);
    const user = await UsuarioModel.findByEmail(data.email);

    if (!user || !(await bcrypt.compare(data.senha, user.senha_hash))) {
      throw ApiError.unauthorized('E-mail ou senha incorretos');
    }

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      token,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role },
    };
  },

  async me(id) {
    const user = await UsuarioModel.findById(id);
    if (!user) throw ApiError.notFound('Usuario nao encontrado');
    return user;
  },

  list: (query) => UsuarioModel.findAll(query),

  async updateRole(id, role) {
    if (!ROLES.includes(role)) throw ApiError.badRequest('Role invalido');
    const user = await UsuarioModel.findById(id);
    if (!user) throw ApiError.notFound('Usuario nao encontrado');
    return UsuarioModel.updateRole(id, role);
  },

  async remove(id) {
    const user = await UsuarioModel.findById(id);
    if (!user) throw ApiError.notFound('Usuario nao encontrado');
    return UsuarioModel.remove(id);
  },
};

function parse(schema, payload) {
  const r = schema.safeParse(payload);
  if (!r.success) throw ApiError.badRequest('Dados invalidos', r.error.flatten().fieldErrors);
  return r.data;
}

module.exports = UsuarioService;
