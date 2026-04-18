const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listByExpedient(req, res) {
  const { expedientId } = req.params;
  const visits = await prisma.visit.findMany({
    where: { expedientId },
    orderBy: { date: 'desc' },
  });
  res.json(visits);
}

async function create(req, res) {
  const { expedientId } = req.params;
  const { date, visitorName, visitorPhone, feedback, interestLevel } = req.body;
  
  const visit = await prisma.visit.create({
    data: {
      expedientId,
      date: new Date(date),
      visitorName,
      visitorPhone,
      feedback,
      interestLevel,
    },
  });
  
  res.status(201).json(visit);
}

async function update(req, res) {
  const { id } = req.params;
  const { date, visitorName, visitorPhone, feedback, interestLevel } = req.body;
  
  const visit = await prisma.visit.update({
    where: { id },
    data: {
      date: date ? new Date(date) : undefined,
      visitorName,
      visitorPhone,
      feedback,
      interestLevel,
    },
  });
  
  res.json(visit);
}

async function remove(req, res) {
  const { id } = req.params;
  await prisma.visit.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listByExpedient, create, update, remove };
