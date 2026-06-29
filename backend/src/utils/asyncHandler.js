'use strict';

/** Envolve handlers async e encaminha erros ao middleware central. */
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
