'use strict';
const { Router } = require('express');
const ctrl     = require('../controllers/eventoController');
const partCtrl = require('../controllers/participacaoController');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Publicas
router.get('/',       ctrl.index);
router.get('/id/:id', ctrl.showById);

// Participacoes — antes de /:slug para nao colidir
router.get('/:id/participar',     requireAuth(),          partCtrl.status);
router.post('/:id/participar',    requireAuth(),          partCtrl.confirmar);
router.delete('/:id/participar',  requireAuth(),          partCtrl.cancelar);
router.get('/:id/participantes',  requireAuth(['admin']), partCtrl.listarParticipantes);

// Detalhe por slug
router.get('/:slug', ctrl.show);

// Admin CRUD
router.post('/',      requireAuth(['admin']), ctrl.store);
router.put('/:id',    requireAuth(['admin']), ctrl.update);
router.delete('/:id', requireAuth(['admin']), ctrl.destroy);

module.exports = router;
