const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documents.controller');
const upload = require('../middleware/upload.middleware');

router.get('/expedient/:expedientId', ctrl.listByExpedient);
router.post('/expedient/:expedientId', upload.single('file'), ctrl.upload);
router.put('/:id/validate', ctrl.validate);
router.put('/:id/reject', ctrl.reject);
router.delete('/:id', ctrl.remove);
router.get('/:id/download', ctrl.download);
router.get('/:id/preview', ctrl.preview);

module.exports = router;
