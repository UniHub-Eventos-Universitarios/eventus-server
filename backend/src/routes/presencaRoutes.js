'use strict';
const { Router } = require('express');
const ctrl = require('../controllers/presencaController');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Registrar / cancelar presenca (qualquer usuario logado)
router.post('/',   requireAuth(), ctrl.marcar);
router.delete('/', requireAuth(), ctrl.cancelar);

module.exports = router;
