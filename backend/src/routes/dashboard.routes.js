const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboard.controller');

router.get('/stats', ctrl.getStats);
router.get('/alerts', ctrl.getAlerts);
router.get('/activity', ctrl.getRecentActivity);

module.exports = router;
