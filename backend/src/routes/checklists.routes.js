const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/checklists.controller');
const { authorize } = require('../middleware/auth.middleware');

// Plantillas (solo administración/dirección puede modificar)
router.get('/templates', ctrl.listTemplates);
router.post('/templates', authorize('DIRECCION', 'ADMINISTRACION'), ctrl.createTemplate);
router.put('/templates/:id', authorize('DIRECCION', 'ADMINISTRACION'), ctrl.updateTemplate);

// Instancias por expediente
router.get('/expedient/:expedientId', ctrl.listByExpedient);
router.post('/expedient/:expedientId/generate', ctrl.generateForExpedient);

// Items de instancia
router.put('/instance/:instanceId/item/:itemId', ctrl.updateItem);
router.post('/instance/:instanceId/complete', ctrl.completeChecklist);

module.exports = router;
