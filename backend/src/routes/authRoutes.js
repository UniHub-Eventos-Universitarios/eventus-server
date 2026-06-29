'use strict';
const { Router } = require('express');
const ctrl = require('../controllers/usuarioController');
const presCtrl  = require('../controllers/presencaController');
const partCtrl  = require('../controllers/participacaoController');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',            requireAuth(), ctrl.me);
router.get('/me/presencas',  requireAuth(), presCtrl.minhas);
router.get('/me/eventos',    requireAuth(), partCtrl.meusEventos);

module.exports = router;
