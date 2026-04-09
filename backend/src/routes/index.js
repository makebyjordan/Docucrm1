const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.use('/auth', require('./auth.routes'));
router.use('/clients', authenticate, require('./clients.routes'));
router.use('/expedients', authenticate, require('./expedients.routes'));
router.use('/checklists', authenticate, require('./checklists.routes'));
router.use('/documents', authenticate, require('./documents.routes'));
router.use('/notifications', authenticate, require('./notifications.routes'));
router.use('/dashboard', authenticate, require('./dashboard.routes'));
router.use('/email-templates', authenticate, require('./emailTemplates.routes'));
router.use('/users', authenticate, require('./users.routes'));

module.exports = router;
