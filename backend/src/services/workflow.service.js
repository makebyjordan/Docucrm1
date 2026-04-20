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
  CAPTACION:             { next: 'VALORACION' },
  VALORACION:            { next: 'FORMULARIO' },
  FORMULARIO:            { next: 'DOCUMENTACION' },
  DOCUMENTACION:         { next: 'VALIDACION' },
  VALIDACION:            {
    next: 'ACUERDO',
    conditional: true,
    onNo: 'BLOQUEADO',
  },
  ACUERDO:               { next: 'MARKETING_FORMULARIO' },
  MARKETING_FORMULARIO:  { next: 'MARKETING_EJECUCION' },
  MARKETING_EJECUCION:   { next: 'VISITAS' },
  VISITAS:               { next: 'PREVENTA' },
  PREVENTA:              { next: 'BUSQUEDA_ACTIVA' },
  BUSQUEDA_ACTIVA:       {
    next: 'NEGOCIACION',
    conditional: true,
    onNo: 'ACUERDO',
  },
  NEGOCIACION:           { next: 'ACUERDO_INTERESADO' },
  ACUERDO_INTERESADO:    { next: 'ARRAS' },
  ARRAS:                 { 
    next: 'HIPOTECA',
    conditional: true,
    onNo: 'NOTARIA', // Si no requiere hipoteca, salta a Notaría
  },
  HIPOTECA:              { next: 'NOTARIA' },
  NOTARIA:               { next: 'CIERRE' },
  CIERRE:                {
    next: 'POSVENTA',
    conditional: true,
    onNo: 'ACUERDO',
  },
  POSVENTA:              { next: 'CERRADO' },
};

/**
 * Transiciones específicas para INQUILINO.
 * Flujo: Captación → Formulario → Documentación → Validación → Visitas → Negociación → Acuerdo → Cierre → Posventa
 * Excluye fases de venta: Valoración, Marketing, Preventa, Búsqueda, Arras, Hipoteca, Notaría
 */
const INQUILINO_TRANSITIONS = {
  CAPTACION:             { next: 'FORMULARIO' },              // Salta valoración
  FORMULARIO:            { next: 'DOCUMENTACION' },
  DOCUMENTACION:         { next: 'VALIDACION' },
  VALIDACION:            {
    next: 'VISITAS',                                           // Pasa directo a visitas
    conditional: true,
    onNo: 'BLOQUEADO',
  },
  VISITAS:               { next: 'NEGOCIACION' },              // De visitas a negociación directa
  NEGOCIACION:           { next: 'ACUERDO_INTERESADO' },
  ACUERDO_INTERESADO:    { next: 'CIERRE' },                   // Salta arras/hipoteca/notaría
  CIERRE:                { next: 'POSVENTA' },
  POSVENTA:              { next: 'CERRADO' },
};

/**
 * Transiciones específicas para PROPIETARIO (Alquiler).
 * Flujo: Captación → Valoración → Formulario → Documentación → Acuerdo → Marketing (Brief) → Mkt (Ejecución) → Visitas → Negociación → Cierre → Posventa
 * Excluye fases de venta: Preventa, Búsqueda, Arras, Hipoteca, Notaría
 */
const PROPIETARIO_TRANSITIONS = {
  CAPTACION:             { next: 'VALORACION' },
  VALORACION:            { next: 'FORMULARIO' },
  FORMULARIO:            { next: 'DOCUMENTACION' },
  DOCUMENTACION:         { next: 'ACUERDO' },
  ACUERDO:               { next: 'MARKETING_FORMULARIO' },
  MARKETING_FORMULARIO:  { next: 'MARKETING_EJECUCION' },
  MARKETING_EJECUCION:   { next: 'VISITAS' },
  VISITAS:               { next: 'NEGOCIACION' },
  NEGOCIACION:           { next: 'CIERRE' },
  CIERRE:                { next: 'POSVENTA' },
  POSVENTA:              { next: 'CERRADO' },
};

/**
 * Transiciones específicas para INVERSION_HOLDERS (Inversores).
 * Flujo: Captación (Perfilado) → Formulario (Criterios) → Documentación (KYC) → Búsqueda Activa → Valoración (Análisis ROI) → Visitas → Negociación (Oferta) → Arras → Cierre → Posventa
 */
const INVERSION_TRANSITIONS = {
  CAPTACION:             { next: 'FORMULARIO' },
  FORMULARIO:            { next: 'DOCUMENTACION' },
  DOCUMENTACION:         { next: 'BUSQUEDA_ACTIVA' },
  BUSQUEDA_ACTIVA:       { next: 'VALORACION' },
  VALORACION:            { next: 'VISITAS' },
  VISITAS:               { next: 'NEGOCIACION' },
  NEGOCIACION:           { next: 'ARRAS' },
  ARRAS:                 { next: 'CIERRE' },
  CIERRE:                { next: 'POSVENTA' },
  POSVENTA:              { next: 'CERRADO' },
};

const PHASE_LABELS = {
  CAPTACION: 'Captación',
  VALORACION: 'Valoración',
  FORMULARIO: 'Formulario inicial',
  DOCUMENTACION: 'Documentación',
  VALIDACION: 'Validación',
  ACUERDO: 'Acuerdo / Exclusiva',
  MARKETING_FORMULARIO: 'Brief Marketing',
  MARKETING_EJECUCION: 'Producción Mkt',
  VISITAS: 'Registro de Visitas',
  PREVENTA: 'Lanzamiento Preventa',
  BUSQUEDA_ACTIVA: 'Búsqueda activa',
  NEGOCIACION: 'Negociación',
  ACUERDO_INTERESADO: 'Propuesta / Señal',
  ARRAS: 'Contrato de Arras',
  HIPOTECA: 'Gestión Hipotecaria',
  NOTARIA: 'Notaría y Firmas',
  CIERRE: 'Cierre de operación',
  POSVENTA: 'Posventa',
  CERRADO: 'Finalizado',
};

/**
 * Determina la siguiente fase basada en el contexto del expediente.
 */
async function getNextPhase(expedient, currentPhase, decision) {
  // 1. INQUILINO tiene su propio mapa de transiciones
  if (expedient.operationType === 'INQUILINO') {
    const transition = INQUILINO_TRANSITIONS[currentPhase];
    if (transition) {
      if (transition.conditional) {
        if (!decision) return null; // Necesita decisión
        return decision === 'NO' ? transition.onNo : transition.next;
      }
      return transition.next;
    }
  }

  // 2. PROPIETARIO (Alquiler) tiene su propio mapa
  if (expedient.operationType === 'PROPIETARIO') {
    const transition = PROPIETARIO_TRANSITIONS[currentPhase];
    if (transition) return transition.next;
  }

  // 3. INVERSION_HOLDERS
  if (expedient.operationType === 'INVERSION_HOLDERS') {
    const transition = INVERSION_TRANSITIONS[currentPhase];
    if (transition) return transition.next;
  }

  // 4. Mapa estándar
  const transition = TRANSITIONS[currentPhase];
  if (transition) {
    if (currentPhase === 'CAPTACION' && expedient.operationType === 'COMPRA') {
      return 'FORMULARIO';
    }
    if (transition.conditional) {
      if (decision === 'NO') return transition.onNo;
      return transition.next;
    }
    return transition.next;
  }

  // 5. LÓGICA DINÁMICA: Si no está en los mapas hardcoded, buscamos por orden de plantillas
  const templates = await prisma.checklistTemplate.findMany({
    where: { operationType: expedient.operationType, active: true },
    orderBy: { order: 'asc' },
  });

  // Agrupamos por fase única (ya que puede haber múltiples templates por fase)
  const uniquePhases = [];
  const seen = new Set();
  for (const t of templates) {
    if (!seen.has(t.phase)) {
      uniquePhases.push(t.phase);
      seen.add(t.phase);
    }
  }

  const currentIdx = uniquePhases.indexOf(currentPhase);
  if (currentIdx !== -1 && currentIdx < uniquePhases.length - 1) {
    return uniquePhases[currentIdx + 1];
  }

  return null;
}

/**
 * Avanzar un expediente a la siguiente fase del flujo.
 * @param {Object} expedient - El expediente actual (con datos completos)
 * @param {Object} user - El usuario que realiza la acción
 * @param {string} notes - Notas opcionales
 * @param {string} decision - 'SI' o 'NO' para fases condicionales
 */
async function advance(expedient, user, notes, decision) {
  const currentPhase = expedient.currentPhase;
  const { operationType } = expedient;
  
  let transitionMap = TRANSITIONS;
  if (operationType === 'INQUILINO') transitionMap = INQUILINO_TRANSITIONS;
  if (operationType === 'PROPIETARIO') transitionMap = PROPIETARIO_TRANSITIONS;
  if (operationType === 'INVERSION_HOLDERS') transitionMap = INVERSION_TRANSITIONS;

  const transition = transitionMap[currentPhase];

  if (!transition) {
    return { error: `No hay transición definida desde la fase ${currentPhase}` };
  }

  // Verificar que la checklist actual esté completa antes de avanzar
  const checklistOk = await checklistGenerator.isPhaseComplete(expedient.id, currentPhase);
  if (!checklistOk) {
    return { error: 'Hay ítems obligatorios del checklist sin completar en esta fase.' };
  }

  // Determinar la siguiente fase inteligentemente
  let nextPhase = getNextPhase(expedient, currentPhase, decision);
  
  if (transition.conditional && !decision) {
    return { error: 'Esta fase requiere una decisión: SI o NO' };
  }

  let newStatus = 'ACTIVO';
  if (nextPhase === 'BLOQUEADO') {
    newStatus = 'BLOQUEADO';
    nextPhase = currentPhase; // Se queda en la misma fase pero bloqueado
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
    label: PHASE_LABELS[nextPhase] || nextPhase,
  };
}

module.exports = { advance, PHASE_LABELS, TRANSITIONS };
