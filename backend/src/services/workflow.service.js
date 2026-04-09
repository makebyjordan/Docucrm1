const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const checklistGenerator = require('./checklist.generator');
const notificationEngine = require('./notification.engine');
const logger = require('../config/logger');

/**
 * Mapa de transiciones de fase del flujo de trabajo.
 * Para fases condicionales (SÍ/NO), se usa el campo "decision".
 */
const TRANSITIONS = {
  CAPTACION:             { next: 'FORMULARIO' },
  FORMULARIO:            { next: 'DOCUMENTACION' },
  DOCUMENTACION:         { next: 'VALIDACION' },
  VALIDACION:            {
    // Si la validación es correcta → ACUERDO
    // Si NO → bloquear y notificar al comercial
    next: 'ACUERDO',
    conditional: true,
    onNo: 'BLOQUEADO',
  },
  ACUERDO:               { next: 'MARKETING_FORMULARIO' },
  MARKETING_FORMULARIO:  { next: 'MARKETING_EJECUCION' },
  MARKETING_EJECUCION:   { next: 'PREVENTA' },
  PREVENTA:              { next: 'BUSQUEDA_ACTIVA' },
  BUSQUEDA_ACTIVA:       {
    // SÍ hay interesado → ACUERDO_INTERESADO
    // NO → renovar exclusividad (volver a ACUERDO) o cerrar
    next: 'ACUERDO_INTERESADO',
    conditional: true,
    onNo: 'ACUERDO', // Renovar exclusividad
  },
  ACUERDO_INTERESADO:    { next: 'CIERRE' },
  CIERRE:                {
    // SÍ se cerró → POSVENTA
    // NO → renovar exclusividad o cerrar
    next: 'POSVENTA',
    conditional: true,
    onNo: 'ACUERDO',
  },
  POSVENTA:              { next: 'CERRADO' },
};

const PHASE_LABELS = {
  CAPTACION: 'Captación',
  FORMULARIO: 'Formulario inicial',
  DOCUMENTACION: 'Documentación',
  VALIDACION: 'Validación',
  ACUERDO: 'Acuerdo / Contrato',
  MARKETING_FORMULARIO: 'Brief de Marketing',
  MARKETING_EJECUCION: 'Producción de Marketing',
  PREVENTA: 'Inicio Preventa',
  BUSQUEDA_ACTIVA: 'Búsqueda activa',
  ACUERDO_INTERESADO: 'Acuerdo con interesado',
  CIERRE: 'Cierre',
  POSVENTA: 'Posventa',
  CERRADO: 'Cerrado',
};

/**
 * Avanzar un expediente a la siguiente fase del flujo.
 * @param {Object} expedient - El expediente actual (con datos completos)
 * @param {Object} user - El usuario que realiza la acción
 * @param {string} notes - Notas opcionales
 * @param {string} decision - 'SI' o 'NO' para fases condicionales
 */
async function advance(expedient, user, notes, decision) {
  const currentPhase = expedient.currentPhase;
  const transition = TRANSITIONS[currentPhase];

  if (!transition) {
    return { error: `No hay transición definida desde la fase ${currentPhase}` };
  }

  // Verificar que la checklist actual esté completa antes de avanzar
  const checklistOk = await checklistGenerator.isPhaseComplete(expedient.id, currentPhase);
  if (!checklistOk) {
    return { error: 'Hay ítems obligatorios del checklist sin completar en esta fase.' };
  }

  let nextPhase;
  let newStatus = 'ACTIVO';

  if (transition.conditional) {
    if (!decision) {
      return { error: 'Esta fase requiere una decisión: SI o NO' };
    }
    if (decision === 'NO') {
      if (transition.onNo === 'BLOQUEADO') {
        newStatus = 'BLOQUEADO';
        nextPhase = currentPhase; // Se queda en la misma fase pero bloqueado
      } else {
        nextPhase = transition.onNo;
      }
    } else {
      nextPhase = transition.next;
    }
  } else {
    nextPhase = transition.next;
  }

  // Registrar cambio de fase
  await prisma.phaseHistory.create({
    data: {
      expedientId: expedient.id,
      fromPhase: currentPhase,
      toPhase: nextPhase,
      changedById: user?.id,
      notes,
    },
  });

  // Actualizar el expediente
  const updated = await prisma.expedient.update({
    where: { id: expedient.id },
    data: { currentPhase: nextPhase, status: newStatus },
    include: {
      client: true,
      assignments: { include: { user: true } },
    },
  });

  // Generar checklists para la nueva fase
  if (nextPhase !== currentPhase) {
    await checklistGenerator.generateForPhase(
      expedient.id, nextPhase,
      expedient.operationType, expedient.operationSize
    );
  }

  // Disparar notificaciones según la transición
  await notificationEngine.onPhaseTransition(updated, currentPhase, nextPhase, decision);

  logger.info(`[Workflow] Expediente ${expedient.code}: ${currentPhase} → ${nextPhase}`);

  return {
    expedient: updated,
    fromPhase: currentPhase,
    toPhase: nextPhase,
    label: PHASE_LABELS[nextPhase],
  };
}

module.exports = { advance, PHASE_LABELS, TRANSITIONS };
