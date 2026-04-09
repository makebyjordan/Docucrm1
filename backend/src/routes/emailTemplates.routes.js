const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/emailTemplates.controller');
const { authorize } = require('../middleware/auth.middleware');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.put('/:id', authorize('DIRECCION', 'ADMINISTRACION'), ctrl.update);
router.post('/:id/preview', ctrl.preview);

module.exports = router;
