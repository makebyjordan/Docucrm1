const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/visits.controller');

router.get('/expedient/:expedientId', ctrl.listByExpedient);
router.post('/expedient/:expedientId', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
