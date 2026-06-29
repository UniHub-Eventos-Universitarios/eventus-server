'use strict';
const { Router } = require('express');
const c = require('../controllers/palestranteController');

const router = Router();
router.get('/', c.index);        // DBE2: ?busca=&area=&sort=&order=&page=&perPage=
router.get('/:id', c.show);
router.post('/', c.store);       // BD2: criar
router.put('/:id', c.update);    // BD2: alterar
router.delete('/:id', c.destroy);// BD2: excluir
module.exports = router;
