'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Retorna um middleware que verifica o JWT e, opcionalmente,
 * exige que o usuario tenha um dos roles informados.
 *
 * @param {string[]} [roles] - ex: ['admin'] ou ['admin','professor']
 */
function requireAuth(roles = []) {
  return (req, _res, next) => {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) throw ApiError.unauthorized('Token nao fornecido');

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw ApiError.unauthorized('Token invalido ou expirado');
    }

    if (roles.length && !roles.includes(payload.role)) {
      throw ApiError.forbidden('Acesso negado para este perfil');
    }

    req.user = payload; // { id, nome, email, role }
    next();
  };
}

module.exports = { requireAuth };
