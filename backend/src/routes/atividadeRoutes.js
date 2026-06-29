'use strict';
const { Router } = require('express');
const c = require('../controllers/atividadeController');

const router = Router();
router.get('/destaques', c.destaques);
router.get('/', c.index);        // DBE2: ?busca=&tipo=&trilha=&data=&sort=&order=&page=&perPage=
router.get('/:id', c.show);
router.post('/', c.store);
router.put('/:id', c.update);
router.delete('/:id', c.destroy);
module.exports = router;
