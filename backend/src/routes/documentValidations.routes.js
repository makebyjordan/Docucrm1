const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentValidations.controller');

// Por expediente
router.get('/expedient/:expedientId', ctrl.listByExpedient);

// Por documento
router.get('/document/:documentId', ctrl.listByDocument);
router.post('/document/:documentId', ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
