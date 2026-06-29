'use strict';
const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const presCtrl = require('../controllers/presencaController');
const usuCtrl  = require('../controllers/usuarioController');

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    name: 'Eventus API',
    version: '2.0.0',
    endpoints: ['/auth', '/eventos', '/atividades', '/palestrantes', '/locais', '/inscricoes', '/presencas', '/admin', '/health'],
  });
});

router.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Auth
router.use('/auth', require('./authRoutes'));

// Recursos publicos
router.use('/eventos',      require('./eventoRoutes'));
router.use('/atividades',   require('./atividadeRoutes'));
router.use('/palestrantes', require('./palestranteRoutes'));
router.use('/locais',       require('./localRoutes'));
router.use('/inscricoes',   require('./inscricaoRoutes'));

// Presencas (usuario autenticado)
router.use('/presencas', require('./presencaRoutes'));

// Presencas por atividade (admin)
router.get(
  '/atividades/:id/presencas',
  requireAuth(['admin']),
  presCtrl.porAtividade
);

// Rotas admin — gerenciar usuarios
router.get('/admin/usuarios',            requireAuth(['admin']), usuCtrl.index);
router.patch('/admin/usuarios/:id/role', requireAuth(['admin']), usuCtrl.updateRole);
router.delete('/admin/usuarios/:id',     requireAuth(['admin']), usuCtrl.destroy);

module.exports = router;
