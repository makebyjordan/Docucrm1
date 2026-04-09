const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list(req, res) {
  const { search, type, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(type && { type }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { expedients: true } } },
    }),
    prisma.client.count({ where }),
  ]);

  res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
}

async function getById(req, res) {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: {
      expedients: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, code: true, operationType: true, currentPhase: true, status: true, openedAt: true },
      },
    },
  });
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(client);
}

async function create(req, res) {
  const client = await prisma.client.create({ data: req.body });
  res.status(201).json(client);
}

async function update(req, res) {
  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(client);
}

async function remove(req, res) {
  const count = await prisma.expedient.count({ where: { clientId: req.params.id } });
  if (count > 0) {
    return res.status(400).json({ error: 'No se puede eliminar un cliente con expedientes activos' });
  }
  await prisma.client.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

module.exports = { list, getById, create, update, remove };
