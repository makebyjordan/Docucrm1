const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const checklistGenerator = require('../services/checklist.generator');
const notificationEngine = require('../services/notification.engine');

async function listTemplates(req, res) {
  const { operationType, phase } = req.query;
  const where = {
    ...(operationType && { operationType }),
    ...(phase && { phase }),
    active: true,
  };
  const templates = await prisma.checklistTemplate.findMany({
    where,
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { operationType: 'asc' },
  });
  res.json(templates);
}

async function createTemplate(req, res) {
  const { items = [], ...templateData } = req.body;
  const template = await prisma.checklistTemplate.create({
    data: {
      ...templateData,
      items: { create: items.map((item, i) => ({ ...item, order: i })) },
    },
    include: { items: true },
  });
  res.status(201).json(template);
}

async function updateTemplate(req, res) {
  const { items, ...data } = req.body;
  const template = await prisma.checklistTemplate.update({
    where: { id: req.params.id },
    data,
  });
  res.json(template);
}

async function listByExpedient(req, res) {
  const instances = await prisma.checklistInstance.findMany({
    where: { expedientId: req.params.expedientId },
    include: {
      template: true,
      items: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Añadir porcentaje de completitud
  const withProgress = instances.map(inst => {
    const total = inst.items.length;
    const done = inst.items.filter(i => i.completed).length;
    const required = inst.items.filter(i => i.required).length;
    const requiredDone = inst.items.filter(i => i.required && i.completed).length;
    return {
      ...inst,
      progress: { total, done, required, requiredDone, percent: total ? Math.round((done / total) * 100) : 0 },
    };
  });

  res.json(withProgress);
}

async function generateForExpedient(req, res) {
  const { expedientId } = req.params;
  const { phase } = req.body;

  const expedient = await prisma.expedient.findUnique({ where: { id: expedientId } });
  if (!expedient) return res.status(404).json({ error: 'Expediente no encontrado' });

  const instances = await checklistGenerator.generateForPhase(
    expedientId, phase || expedient.currentPhase,
    expedient.operationType, expedient.operationSize
  );

  res.status(201).json(instances);
}

async function updateItem(req, res) {
  const { instanceId, itemId } = req.params;
  const { completed, notes } = req.body;

  const item = await prisma.checklistInstanceItem.update({
    where: { id: itemId },
    data: {
      completed,
      notes,
      ...(completed && { completedAt: new Date(), completedBy: req.user.name }),
      ...(!completed && { completedAt: null, completedBy: null }),
    },
  });

  // Verificar si la instancia completa está terminada
  const instance = await prisma.checklistInstance.findUnique({
    where: { id: instanceId },
    include: { items: true },
  });

  const allRequiredDone = instance.items.filter(i => i.required).every(i => i.completed);
  if (allRequiredDone && !instance.completedAt) {
    await prisma.checklistInstance.update({
      where: { id: instanceId },
      data: { completedAt: new Date() },
    });
  } else if (!allRequiredDone && instance.completedAt) {
    await prisma.checklistInstance.update({
      where: { id: instanceId },
      data: { completedAt: null },
    });
  }

  res.json(item);
}

async function completeChecklist(req, res) {
  const instance = await prisma.checklistInstance.update({
    where: { id: req.params.instanceId },
    data: { completedAt: new Date() },
    include: { items: true },
  });
  res.json(instance);
}

module.exports = {
  listTemplates, createTemplate, updateTemplate,
  listByExpedient, generateForExpedient,
  updateItem, completeChecklist,
};
