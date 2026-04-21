const router = require('express').Router({ mergeParams: true })
const ctrl = require('../controllers/expedientLinks.controller')

router.get('/:id/links', ctrl.listLinks)
router.post('/:id/links', ctrl.createLink)
router.patch('/links/:linkId', ctrl.updateLink)
router.delete('/links/:linkId', ctrl.deleteLink)
router.get('/:id/links/check-blockers', ctrl.checkBlockers)

module.exports = router
