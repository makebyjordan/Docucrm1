const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/users.controller');
const { authorize } = require('../middleware/auth.middleware');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', authorize('DIRECCION', 'ADMINISTRACION'), ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', authorize('DIRECCION', 'ADMINISTRACION'), ctrl.remove);

module.exports = router;
