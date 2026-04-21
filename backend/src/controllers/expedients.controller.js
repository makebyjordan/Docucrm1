const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const workflowService = require('../services/workflow.service');
const checklistGenerator = require('../services/checklist.generator');
const driveService = require('../services/drive.service');
const notificationEngine = require('../services/notification.engine');
const logger = require('../config/logger');

// ─── Generar código de expediente ─────────────────────────────────────────────
async function generateCode() {
  const year = new Date().getFullYear();
  const count = await prisma.expedient.count();
  return `EXP-${year}-${String(count + 1).padStart(4, '0')}`;
}

// ─── Listar expedientes ───────────────────────────────────────────────────────
async function list(req, res) {
  const {
    phase, status, operationType, operationSize,
    comercialId, search, page = 1, limit = 20,
  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(phase && { currentPhase: phase }),
    ...(status && { status }),
    ...(operationType && { operationType }),
    ...(operationSize && { operationSize }),
    ...(comercialId && {
      assignments: { some: { userId: comercialId, role: 'COMERCIAL' } },
    }),
    ...(search && {
      OR: [
        { code: { contains: search, mode: 'insensitive' } },
        { propertyAddress: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
        { client: { companyName: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  };

  // Comerciales solo ven sus propios expedientes
  if (req.user.role === 'COMERCIAL') {
    where.assignments = { some: { userId: req.user.id } };
  }

  const [data, total] = await Promise.all([
    prisma.expedient.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      include: {
        client: true,
        assignments: { include: { user: { select: { id: true, name: true, role: true } } } },
        _count: { select: { documents: true, checklists: true } },
      },
    }),
    prisma.expedient.count({ where }),
  ]);

  res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
}

// ─── Vista Kanban ─────────────────────────────────────────────────────────────
async function kanban(req, res) {
  const phases = [
    'CAPTACION', 'FORMULARIO', 'DOCUMENTACION', 'VALIDACION',
    'ACUERDO', 'MARKETING_FORMULARIO', 'MARKETING_EJECUCION',
    'PREVENTA', 'BUSQUEDA_ACTIVA', 'ACUERDO_INTERESADO',
    'CIERRE', 'POSVENTA',
  ];

  const where = req.user.role === 'COMERCIAL'
    ? { assignments: { some: { userId: req.user.id } }, status: { not: 'CANCELADO' } }
    : { status: { not: 'CANCELADO' } };

  const expedients = await prisma.expedient.findMany({
    where,
    include: {
      client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
      assignments: { include: { user: { select: { id: true, name: true, role: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const columns = phases.reduce((acc, phase) => {
    acc[phase] = expedients.filter(e => e.currentPhase === phase);
    return acc;
  }, {});

  res.json(columns);
}

// ─── Obtener por ID ───────────────────────────────────────────────────────────
async function getById(req, res) {
  const expedient = await prisma.expedient.findUnique({
    where: { id: req.params.id },
    include: {
      client: true,
      assignments: { include: { user: { select: { id: true, name: true, email: true, role: true, phone: true } } } },
      checklists: {
        include: { template: true, items: { orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      },
      documents: { orderBy: { createdAt: 'desc' } },
      signatures: { orderBy: { createdAt: 'desc' } },
      buyers: { orderBy: { createdAt: 'desc' } },
      visits: { orderBy: { date: 'desc' } },
      clientRoles: { include: { client: true }, orderBy: { createdAt: 'asc' } },
      phaseHistory: {
        include: { changedBy: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!expedient) return res.status(404).json({ error: 'Expediente no encontrado' });
  res.json(expedient);
}

// ─── Crear expediente ─────────────────────────────────────────────────────────
async function create(req, res) {
  const code = await generateCode();
  const { clientId, operationType, operationSize = 'INDIVIDUAL', assignments = [], ...rest } = req.body;

  const expedient = await prisma.expedient.create({
    data: {
      code, clientId, operationType, operationSize, ...rest,
      currentPhase: 'CAPTACION',
      status: 'ACTIVO',
    },
  });

  // Asignar comercial que crea el expediente como primario
  await prisma.expedientAssignment.create({
    data: { expedientId: expedient.id, userId: req.user.id, role: 'COMERCIAL', isPrimary: true },
  });

  // Asignaciones adicionales
  for (const a of assignments) {
    if (a.userId !== req.user.id || a.role !== 'COMERCIAL') {
      await prisma.expedientAssignment.upsert({
        where: { expedientId_role_userId: { expedientId: expedient.id, role: a.role, userId: a.userId } },
        create: { expedientId: expedient.id, userId: a.userId, role: a.role },
        update: {},
      });
    }
  }

  // Crear carpeta en Drive
  try {
    const folder = await driveService.createExpedientFolder(expedient.code, expedient.id);
    if (folder) {
      await prisma.expedient.update({
        where: { id: expedient.id },
        data: { driveFolder: folder.name, driveFolderId: folder.id },
      });
    }
  } catch (err) {
    logger.warn('Drive no disponible:', err.message);
  }

  // Generar checklists iniciales
  await checklistGenerator.generateForPhase(expedient.id, 'CAPTACION', operationType, operationSize);

  // Notificar apertura
  await notificationEngine.onExpedientCreated(expedient.id);

  const full = await prisma.expedient.findUnique({
    where: { id: expedient.id },
    include: { client: true, assignments: { include: { user: true } } },
  });

  res.status(201).json(full);
}

// ─── Actualizar expediente ────────────────────────────────────────────────────
async function update(req, res) {
  const { assignments, ...data } = req.body;
  const expedient = await prisma.expedient.update({
    where: { id: req.params.id },
    data,
  });
  res.json(expedient);
}

// ─── Eliminar expediente ──────────────────────────────────────────────────────
async function remove(req, res) {
  await prisma.expedient.update({
    where: { id: req.params.id },
    data: { status: 'CANCELADO' },
  });
  res.status(204).send();
}

// ─── Avanzar de fase ──────────────────────────────────────────────────────────
async function advancePhase(req, res) {
  const { id } = req.params;
  const { notes, decision } = req.body; // decision: 'SI' | 'NO' (para fases condicionales)

  const expedient = await prisma.expedient.findUnique({
    where: { id },
    include: { checklists: { include: { items: true } } },
  });
  if (!expedient) return res.status(404).json({ error: 'Expediente no encontrado' });
  if (expedient.status === 'BLOQUEADO') {
    return res.status(400).json({ error: 'El expediente está bloqueado. Resuelve los problemas antes de avanzar.' });
  }

  const result = await workflowService.advance(expedient, req.user, notes, decision);

  if (result.error) return res.status(400).json({ error: result.error });

  res.json(result);
}

// ─── Bloquear expediente ──────────────────────────────────────────────────────
async function blockExpedient(req, res) {
  const { reason } = req.body;
  const expedient = await prisma.expedient.update({
    where: { id: req.params.id },
    data: { status: 'BLOQUEADO' },
  });
  await notificationEngine.onBlocked(expedient.id, reason);
  res.json(expedient);
}

// ─── Desbloquear expediente ───────────────────────────────────────────────────
async function unblockExpedient(req, res) {
  const expedient = await prisma.expedient.update({
    where: { id: req.params.id },
    data: { status: 'ACTIVO' },
  });
  res.json(expedient);
}

// ─── Cerrar expediente (venta cerrada) ───────────────────────────────────────
async function closeExpedient(req, res) {
  const { closedAt = new Date() } = req.body;
  const closedDate = new Date(closedAt);

  const expedient = await prisma.expedient.update({
    where: { id: req.params.id },
    data: {
      status: 'COMPLETADO',
      currentPhase: 'POSVENTA',
      closedAt: closedDate,
      postventa3At: new Date(closedDate.getTime() + 90 * 24 * 60 * 60 * 1000),
      postventa6At: new Date(closedDate.getTime() + 180 * 24 * 60 * 60 * 1000),
      postventa12At: new Date(closedDate.getTime() + 365 * 24 * 60 * 60 * 1000),
    },
    include: { client: true, assignments: { include: { user: true } } },
  });

  await notificationEngine.onOperacionCerrada(expedient.id);
  res.json(expedient);
}

// ─── Cancelar expediente ──────────────────────────────────────────────────────
async function cancelExpedient(req, res) {
  const expedient = await prisma.expedient.update({
    where: { id: req.params.id },
    data: { status: 'CANCELADO', currentPhase: 'CANCELADO' },
  });
  res.json(expedient);
}

// ─── Renovar exclusividad ─────────────────────────────────────────────────────
async function renewExclusivity(req, res) {
  const { months = 3 } = req.body;
  const start = new Date();
  const end = new Date(start.getTime() + months * 30 * 24 * 60 * 60 * 1000);

  const expedient = await prisma.expedient.update({
    where: { id: req.params.id },
    data: {
      exclusivityStart: start,
      exclusivityMonths: months,
      exclusivityEnd: end,
      currentPhase: 'ACUERDO',
      status: 'ACTIVO',
    },
  });

  await notificationEngine.onRenovarExclusividad(expedient.id);
  res.json(expedient);
}

// ─── Asignaciones ─────────────────────────────────────────────────────────────
async function getAssignments(req, res) {
  const assignments = await prisma.expedientAssignment.findMany({
    where: { expedientId: req.params.id },
    include: { user: { select: { id: true, name: true, email: true, role: true, phone: true } } },
  });
  res.json(assignments);
}

async function setAssignment(req, res) {
  const { userId, role, isPrimary = false } = req.body;
  const assignment = await prisma.expedientAssignment.upsert({
    where: { expedientId_role_userId: { expedientId: req.params.id, role, userId } },
    create: { expedientId: req.params.id, userId, role, isPrimary },
    update: { isPrimary },
    include: { user: true },
  });
  res.json(assignment);
}

async function removeAssignment(req, res) {
  await prisma.expedientAssignment.delete({ where: { id: req.params.assignmentId } });
  res.status(204).send();
}

// ─── Compradores / Interesados ────────────────────────────────────────────────
async function getBuyers(req, res) {
  const buyers = await prisma.buyer.findMany({
    where: { expedientId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(buyers);
}

async function addBuyer(req, res) {
  const buyer = await prisma.buyer.create({
    data: { ...req.body, expedientId: req.params.id },
  });
  res.status(201).json(buyer);
}

async function updateBuyer(req, res) {
  const buyer = await prisma.buyer.update({
    where: { id: req.params.buyerId },
    data: req.body,
  });
  res.json(buyer);
}

async function removeBuyer(req, res) {
  await prisma.buyer.delete({ where: { id: req.params.buyerId } });
  res.status(204).send();
}

// ─── Historial de fases ───────────────────────────────────────────────────────
async function getPhaseHistory(req, res) {
  const history = await prisma.phaseHistory.findMany({
    where: { expedientId: req.params.id },
    include: { changedBy: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(history);
}

// ─── Expedientes vinculados ───────────────────────────────────────────────────
async function getLinkedExpedients(req, res) {
  const { id } = req.params;

  const expedient = await prisma.expedient.findUnique({
    where: { id },
    select: { parentExpedientId: true },
  });
  if (!expedient) return res.status(404).json({ error: 'Expediente no encontrado' });

  const [children, parent] = await Promise.all([
    prisma.expedient.findMany({
      where: { parentExpedientId: id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        assignments: { include: { user: { select: { id: true, name: true, role: true } } } },
        _count: { select: { documents: true, checklists: true } },
      },
    }),
    expedient.parentExpedientId
      ? prisma.expedient.findUnique({
          where: { id: expedient.parentExpedientId },
          include: {
            client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
            assignments: { include: { user: { select: { id: true, name: true, role: true } } } },
          },
        })
      : null,
  ]);

  res.json({ parent, children });
}

async function linkExpedient(req, res) {
  const { id } = req.params;
  const { childId, expedientRole } = req.body;

  if (!childId) return res.status(400).json({ error: 'childId es requerido' });

  const updated = await prisma.expedient.update({
    where: { id: childId },
    data: {
      parentExpedientId: id,
      ...(expedientRole && { expedientRole }),
    },
    include: { client: true },
  });

  res.json(updated);
}

async function unlinkExpedient(req, res) {
  const { childId } = req.params;

  const updated = await prisma.expedient.update({
    where: { id: childId },
    data: { parentExpedientId: null },
  });

  res.json(updated);
}

async function setExpedientRole(req, res) {
  const { id } = req.params;
  const { expedientRole } = req.body;

  const updated = await prisma.expedient.update({
    where: { id },
    data: { expedientRole },
  });

  res.json(updated);
}

module.exports = {
  list, kanban, getById, create, update, remove,
  advancePhase, blockExpedient, unblockExpedient, closeExpedient,
  cancelExpedient, renewExclusivity,
  getAssignments, setAssignment, removeAssignment,
  getBuyers, addBuyer, updateBuyer, removeBuyer,
  getPhaseHistory,
  getLinkedExpedients, linkExpedient, unlinkExpedient, setExpedientRole,
};
