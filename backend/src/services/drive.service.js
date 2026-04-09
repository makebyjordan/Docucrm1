const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

function getAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
    return null;
  }
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

/**
 * Crear carpeta para un expediente en Google Drive.
 */
async function createExpedientFolder(expedientCode, expedientId) {
  const auth = getAuth();
  if (!auth) {
    logger.info('[Drive] No configurado. Omitiendo creación de carpeta.');
    return null;
  }

  const drive = google.drive({ version: 'v3', auth });
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  // Crear carpeta principal del expediente
  const folder = await drive.files.create({
    requestBody: {
      name: expedientCode,
      mimeType: 'application/vnd.google-apps.folder',
      ...(rootFolderId && { parents: [rootFolderId] }),
    },
    fields: 'id, name, webViewLink',
  });

  // Crear subcarpetas por fase
  const subfolders = ['01_Documentacion', '02_Acuerdo', '03_Marketing', '04_Cierre'];
  for (const subfolder of subfolders) {
    await drive.files.create({
      requestBody: {
        name: subfolder,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folder.data.id],
      },
    });
  }

  return folder.data;
}

/**
 * Subir un archivo a Google Drive.
 */
async function uploadFile(folderId, filePath, fileName, mimeType) {
  const auth = getAuth();
  if (!auth || !folderId) return null;

  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      ...(folderId && { parents: [folderId] }),
    },
    media: {
      mimeType,
      body: fs.createReadStream(filePath),
    },
    fields: 'id, name, webViewLink',
  });

  // Hacer el archivo accesible con el enlace
  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return response.data;
}

module.exports = { createExpedientFolder, uploadFile };
