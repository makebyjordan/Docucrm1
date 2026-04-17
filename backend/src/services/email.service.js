const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Enviar un email.
 * @param {Object} opts - { to, subject, html, text, replyTo }
 */
async function send({ to, subject, html, text, replyTo }) {
  if (process.env.EMAIL_ENABLED === 'false' || !process.env.SMTP_USER) {
    logger.debug(`[Email] Desactivado. Se omite envío a: ${to}`);
    return { messageId: 'disabled-' + Date.now() };
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'CRM Inmobiliaria'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    ...(text && { text }),
    ...(replyTo && { replyTo }),
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    logger.info(`[Email] Enviado a ${to} (${info.messageId})`);
    return info;
  } catch (error) {
    logger.error('[Email] Error al enviar:', error.message);
    throw error;
  }
}

module.exports = { send };
