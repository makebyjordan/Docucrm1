const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list(req, res) {
  const { from, to } = req.query;
  const where = {};
  if (from || to) {
    where.startAt = {};
    if (from) where.startAt.gte = new Date(from);
    if (to) where.startAt.lte = new Date(to);
  }
  const events = await prisma.calendarEvent.findMany({
    where,
    orderBy: { startAt: 'asc' },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
      expedient: { select: { id: true, code: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  res.json(events);
}

async function create(req, res) {
  const event = await prisma.calendarEvent.create({
    data: { ...req.body, createdById: req.user.id },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
      expedient: { select: { id: true, code: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  res.status(201).json(event);
}

async function update(req, res) {
  const event = await prisma.calendarEvent.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      client: { select: { id: true, firstName: true, lastName: true, companyName: true } },
      expedient: { select: { id: true, code: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  res.json(event);
}

async function remove(req, res) {
  await prisma.calendarEvent.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

module.exports = { list, create, update, remove };
