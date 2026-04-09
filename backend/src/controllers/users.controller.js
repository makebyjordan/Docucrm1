const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function list(req, res) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, phone: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
}

async function getById(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, email: true, role: true, phone: true, active: true },
  });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
}

async function create(req, res) {
  const { password, ...data } = req.body;
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { ...data, password: hashed },
    select: { id: true, name: true, email: true, role: true, phone: true, active: true },
  });
  res.status(201).json(user);
}

async function update(req, res) {
  const { password, ...data } = req.body;
  const updateData = { ...data };
  if (password) {
    updateData.password = await bcrypt.hash(password, 12);
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, phone: true, active: true },
  });
  res.json(user);
}

async function remove(req, res) {
  await prisma.user.update({
    where: { id: req.params.id },
    data: { active: false },
  });
  res.status(204).send();
}

module.exports = { list, getById, create, update, remove };
