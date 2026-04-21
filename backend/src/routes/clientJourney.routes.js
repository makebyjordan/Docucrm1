const router = require('express').Router()
const { getJourney } = require('../controllers/clientJourney.controller')

router.get('/:clientId', getJourney)

module.exports = router
