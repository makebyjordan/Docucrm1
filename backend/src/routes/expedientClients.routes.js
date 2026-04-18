const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expedientClients.controller');

router.post('/expedient/:expedientId', ctrl.addParticipant);
router.delete('/:id', ctrl.removeParticipant);

module.exports = router;
