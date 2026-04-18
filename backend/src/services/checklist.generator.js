const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');

/**
 * Genera instancias de checklist para un expediente en una fase dada,
 * buscando en las plantillas las que correspondan al tipo de operación.
 */
async function generateForPhase(expedientId, phase, operationType, operationSize = 'INDIVIDUAL') {
  const templates = await prisma.checklistTemplate.findMany({
    where: {
      phase,
      active: true,
      OR: [
        { operationType, operationSize },
        { operationType, operationSize: 'INDIVIDUAL' },
      ],
    },
    include: { items: { orderBy: { order: 'asc' } } },
  });

  // Si no hay plantillas específicas, buscar genéricas para el tipo de operación
  let toCreate = templates;
  if (toCreate.length === 0) {
    const fallback = await prisma.checklistTemplate.findMany({
      where: { phase, active: true, operationType },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    toCreate = fallback;
  }

  const instances = [];
  for (const template of toCreate) {
    // Verificar que no exista ya una instancia para este expediente y plantilla
    const existing = await prisma.checklistInstance.findFirst({
      where: { expedientId, templateId: template.id },
    });
    if (existing) {
      instances.push(existing);
      continue;
    }

    const instance = await prisma.checklistInstance.create({
      data: {
        expedientId,
        templateId: template.id,
        phase,
        items: {
          create: template.items.map(item => ({
            label: item.label,
            description: item.description,
            required: item.required,
            order: item.order,
          })),
        },
      },
      include: { items: true, template: true },
    });
    instances.push(instance);
  }

  logger.info(`[Checklist] Generadas ${instances.length} instancias para fase ${phase} en expediente ${expedientId}`);
  return instances;
}

/**
 * Verifica si todos los checklists obligatorios de una fase están completos.
 */
async function isPhaseComplete(expedientId, phase) {
  let instances = await prisma.checklistInstance.findMany({
    where: { expedientId, phase },
    include: { items: true },
  });

  // Si no hay instancias, intentamos generarlas ahora (recuperación proactiva)
  if (instances.length === 0) {
    const exp = await prisma.expedient.findUnique({ where: { id: expedientId } });
    if (exp && !['CERRADO', 'CANCELADO', 'POSVENTA'].includes(phase)) {
      instances = await generateForPhase(exp.id, phase, exp.operationType, exp.operationSize);
    }
  }

  if (instances.length === 0) {
    // Si después de intentar generar sigue sin haber nada en fases críticas, bloqueamos.
    if (['CERRADO', 'CANCELADO'].includes(phase)) return true;
    return false; 
  }

  for (const instance of instances) {
    const requiredItems = instance.items.filter(i => i.required);
    const allDone = requiredItems.every(i => i.completed);
    if (!allDone) return false;
  }

  return true;
}

module.exports = { generateForPhase, isPhaseComplete };
