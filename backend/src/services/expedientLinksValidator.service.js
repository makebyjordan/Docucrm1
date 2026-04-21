const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const PHASE_ORDER = [
  'CAPTACION','VALORACION','FORMULARIO','DOCUMENTACION','VALIDACION','ACUERDO',
  'MARKETING_FORMULARIO','MARKETING_EJECUCION','VISITAS','PREVENTA',
  'BUSQUEDA_ACTIVA','NEGOCIACION','ACUERDO_INTERESADO','ARRAS',
  'HIPOTECA','NOTARIA','CIERRE','POSVENTA','CERRADO','CANCELADO','BLOQUEADO',
]

function phaseIndex(phase) {
  const idx = PHASE_ORDER.indexOf(phase)
  return idx === -1 ? 999 : idx
}

async function validateAdvanceWithLinks(expedientId) {
  const links = await prisma.expedientLink.findMany({
    where: { expedientId, isBlocking: true },
    include: { linkedExpedient: { select: { id: true, code: true, currentPhase: true } } },
  })

  const blocked = []
  for (const link of links) {
    if (link.requiredPhase) {
      const linkedIdx = phaseIndex(link.linkedExpedient.currentPhase)
      const requiredIdx = phaseIndex(link.requiredPhase)
      if (linkedIdx < requiredIdx) {
        blocked.push({
          code: link.linkedExpedient.code,
          currentPhase: link.linkedExpedient.currentPhase,
          requiredPhase: link.requiredPhase,
          linkType: link.linkType,
        })
      }
    }
  }
  return blocked
}

// Called after an expedient advances — finds expedients that were waiting on
// this one and logs/notifies that their blocking link is now satisfied.
async function checkAndNotifyUnblockedLinks(expedientId, newPhase, prismaClient) {
  const db = prismaClient || prisma

  // Find all outgoing blocking links FROM other expedients TO this one
  const waitingLinks = await db.expedientLink.findMany({
    where: { linkedExpedientId: expedientId, isBlocking: true },
    include: {
      expedient: {
        select: { id: true, code: true, currentPhase: true, status: true },
      },
    },
  })

  for (const link of waitingLinks) {
    if (!link.requiredPhase) continue
    const nowIdx = phaseIndex(newPhase)
    const reqIdx = phaseIndex(link.requiredPhase)

    if (nowIdx >= reqIdx) {
      // This link is now unblocked — log it
      console.info(
        `[Links] Expediente ${link.expedient.code} desbloqueado: su vínculo con expediente ${expedientId} ` +
        `alcanzó la fase requerida ${link.requiredPhase} (nueva fase: ${newPhase})`
      )

      // Update dependencyStatus on the waiting expedient to DESBLOQUEADO
      await db.expedient.update({
        where: { id: link.expedient.id },
        data: { dependencyStatus: 'DESBLOQUEADO' },
      }).catch(() => {}) // non-fatal
    }
  }
}

module.exports = { validateAdvanceWithLinks, checkAndNotifyUnblockedLinks }
