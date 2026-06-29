'use strict';
const ApiError = require('../utils/ApiError');

/** 404 para rotas nao mapeadas. */
function notFound(req, res, next) {
  next(ApiError.notFound(`Rota nao encontrada: ${req.method} ${req.originalUrl}`));
}

/** Tratamento central de erros — resposta JSON padronizada. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const body = {
    error: {
      message: err.message || 'Erro interno do servidor',
      status: statusCode,
    },
  };
  if (err.details) body.error.details = err.details;
  if (statusCode >= 500) {
    // Log apenas de erros inesperados (evita poluir o log com 4xx esperados).
    console.error('[ERRO]', err);
  }
  res.status(statusCode).json(body);
}

module.exports = { notFound, errorHandler };
