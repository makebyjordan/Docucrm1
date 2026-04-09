const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');
const driveService = require('../services/drive.service');
const notificationEngine = require('../services/notification.engine');
const logger = require('../config/logger');

async function listByExpedient(req, res) {
  const { phase } = req.query;
  const where = {
    expedientId: req.params.expedientId,
    ...(phase && { phase }),
  };
  const documents = await prisma.document.findMany({
    where,
    include: { uploadedBy: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(documents);
}

async function upload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó ningún archivo' });

  const { expedientId } = req.params;
  const { docType, phase, name } = req.body;

  const expedient = await prisma.expedient.findUnique({ where: { id: expedientId } });
  if (!expedient) return res.status(404).json({ error: 'Expediente no encontrado' });

  let driveFileId = null;
  let driveUrl = null;

  // Intentar subir a Drive
  try {
    const driveFile = await driveService.uploadFile(
      expedient.driveFolderId,
      req.file.path,
      name || req.file.originalname,
      req.file.mimetype
    );
    if (driveFile) {
      driveFileId = driveFile.id;
      driveUrl = driveFile.webViewLink;
    }
  } catch (err) {
    logger.warn('No se pudo subir a Drive:', err.message);
  }

  const doc = await prisma.document.create({
    data: {
      expedientId,
      uploadedById: req.user.id,
      name: name || req.file.originalname,
      docType: docType || 'OTRO',
      phase: phase || expedient.currentPhase,
      status: 'SUBIDO',
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      driveFileId,
      driveUrl,
    },
    include: { uploadedBy: { select: { name: true, role: true } } },
  });

  res.status(201).json(doc);
}

async function validate(req, res) {
  const { notes } = req.body;
  const doc = await prisma.document.update({
    where: { id: req.params.id },
    data: { status: 'VALIDADO', notes, validatedAt: new Date() },
  });
  res.json(doc);
}

async function reject(req, res) {
  const { rejectedReason } = req.body;
  const doc = await prisma.document.update({
    where: { id: req.params.id },
    data: { status: 'RECHAZADO', rejectedReason },
  });

  // Avisar al comercial del rechazo
  await notificationEngine.onDocumentRejected(doc.expedientId, doc.name, rejectedReason);
  res.json(doc);
}

async function remove(req, res) {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

  // Borrar archivo local
  if (doc.filePath && fs.existsSync(doc.filePath)) {
    fs.unlinkSync(doc.filePath);
  }

  await prisma.document.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

async function download(req, res) {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

  if (doc.driveUrl) {
    return res.redirect(doc.driveUrl);
  }

  if (doc.filePath && fs.existsSync(doc.filePath)) {
    return res.download(doc.filePath, doc.name);
  }

  res.status(404).json({ error: 'Archivo no disponible' });
}

module.exports = { listByExpedient, upload, validate, reject, remove, download };
