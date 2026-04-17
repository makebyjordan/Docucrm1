require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const logger = require('./src/config/logger');
const routes = require('./src/routes');
const { startPostventaScheduler } = require('./src/jobs/postventa.scheduler');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── Error handler global ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Inicio ───────────────────────────────────────────────────────────────────
async function main() {
  try {
    // await prisma.$connect();
    logger.info('Aviso: Conexión explícita a PostgreSQL desactivada temporalmente en el arranque.');

    app.listen(PORT, () => {
      logger.info(`Servidor CRM escuchando en http://localhost:${PORT}`);
    });

    // Arrancar el scheduler de notificaciones de postventa
    startPostventaScheduler();
    logger.info('Scheduler de postventa iniciado');
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

main();

module.exports = { app, prisma };
