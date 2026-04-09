const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notifications.controller');

router.get('/', ctrl.list);
router.get('/expedient/:expedientId', ctrl.listByExpedient);
router.post('/send/:id', ctrl.resend);
router.post('/test', ctrl.sendTest);

module.exports = router;
