'use strict';
const { Router } = require('express');
const c = require('../controllers/localController');

const router = Router();
router.get('/mapa', c.mapa);     // todos os locais com coordenadas (mapa do evento)
router.get('/', c.index);
router.get('/:id', c.show);
router.post('/', c.store);
router.put('/:id', c.update);
router.delete('/:id', c.destroy);
module.exports = router;
