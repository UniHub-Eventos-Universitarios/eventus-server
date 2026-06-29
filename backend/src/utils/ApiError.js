'use strict';

/** Erro de aplicacao com status HTTP, tratado pelo middleware de erro. */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(msg = 'Requisicao invalida', details) {
    return new ApiError(400, msg, details);
  }

  static notFound(msg = 'Recurso nao encontrado') {
    return new ApiError(404, msg);
  }

  static conflict(msg = 'Conflito de dados') {
    return new ApiError(409, msg);
  }

  static unauthorized(msg = 'Nao autenticado') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Acesso proibido') {
    return new ApiError(403, msg);
  }
}

module.exports = ApiError;
