'use strict';
const { Router } = require('express');
const c = require('../controllers/inscricaoController');
const { requireAuth } = require('../middlewares/auth');

const router = Router();
router.get('/',    requireAuth(['admin']), c.index);
router.get('/:id', requireAuth(['admin']), c.show);
router.post('/',   requireAuth(),          c.store);
router.put('/:id', requireAuth(['admin']), c.update);
router.delete('/:id', requireAuth(['admin']), c.destroy);
module.exports = router;
