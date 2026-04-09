require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Datos seed ───────────────────────────────────────────────────────────────

const USERS = [
  { name: 'Admin CRM', email: 'admin@agencia.com', password: 'Admin1234!', role: 'ADMINISTRACION', phone: '600 000 001' },
  { name: 'Dirección', email: 'direccion@agencia.com', password: 'Admin1234!', role: 'DIRECCION', phone: '600 000 002' },
  { name: 'Comercial 1', email: 'comercial1@agencia.com', password: 'Admin1234!', role: 'COMERCIAL', phone: '600 000 003' },
  { name: 'Comercial 2', email: 'comercial2@agencia.com', password: 'Admin1234!', role: 'COMERCIAL', phone: '600 000 004' },
  { name: 'Firmas', email: 'firmas@agencia.com', password: 'Admin1234!', role: 'FIRMAS', phone: '600 000 005' },
  { name: 'Marketing', email: 'marketing@agencia.com', password: 'Admin1234!', role: 'MARKETING', phone: '600 000 006' },
];

// ─── Plantillas de checklist ──────────────────────────────────────────────────
const CHECKLIST_TEMPLATES = [
  // ── VENTA ──────────────────────────────────────────────────────────────────
  {
    name: 'Documentación inicial - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'DOCUMENTACION',
    items: [
      { label: 'DNI/NIE del vendedor (vigente)', required: true },
      { label: 'Escritura de propiedad', required: true },
      { label: 'Nota simple registral (menos de 3 meses)', required: true },
      { label: 'Último recibo de IBI', required: true },
      { label: 'Certificado de deudas con la comunidad', required: true },
      { label: 'Certificado de eficiencia energética', required: true },
      { label: 'Últimas facturas de suministros (agua, luz, gas)', required: false },
      { label: 'Estatutos de la comunidad', required: false },
      { label: 'Planos del inmueble', required: false },
    ],
  },
  {
    name: 'Formulario inicial - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'FORMULARIO',
    items: [
      { label: 'Formulario de captación completado', required: true },
      { label: 'Política de privacidad firmada', required: true },
      { label: 'Datos del inmueble registrados', required: true },
      { label: 'Email del cliente confirmado', required: true },
    ],
  },
  {
    name: 'Validación - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'VALIDACION',
    items: [
      { label: 'DNI vigente y correcto', required: true },
      { label: 'Escritura sin cargas pendientes verificada', required: true },
      { label: 'Nota simple coincide con escritura', required: true },
      { label: 'Certificado energético en vigor', required: true },
      { label: 'IBI al corriente de pago', required: true },
      { label: 'Comunidad sin deudas', required: true },
    ],
  },
  {
    name: 'Contrato de exclusividad - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'ACUERDO',
    items: [
      { label: 'Contrato de exclusividad redactado', required: true },
      { label: 'Contrato firmado por el cliente', required: true },
      { label: 'Contrato subido a Drive', required: true },
      { label: 'Precio de venta acordado y registrado', required: true },
      { label: 'Condiciones de exclusividad aceptadas', required: true },
    ],
  },
  {
    name: 'Brief marketing - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'MARKETING_FORMULARIO',
    items: [
      { label: 'Descripción del inmueble completada', required: true },
      { label: 'Características técnicas registradas', required: true },
      { label: 'Precio de publicación definido', required: true },
      { label: 'Autorización de fotografías firmada', required: true },
      { label: 'Fecha de disponibilidad confirmada', required: true },
    ],
  },
  {
    name: 'Ejecución marketing - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'MARKETING_EJECUCION',
    items: [
      { label: 'Fotografía profesional realizada', required: true },
      { label: 'Plano 2D generado', required: true },
      { label: 'Publicado en Idealista', required: true },
      { label: 'Publicado en Fotocasa', required: true },
      { label: 'Publicado en web propia', required: false },
      { label: 'Redes sociales actualizadas', required: false },
    ],
  },
  {
    name: 'Cierre - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'CIERRE',
    items: [
      { label: 'Contrato de arras firmado', required: true },
      { label: 'Escritura de compraventa notarial', required: true },
      { label: 'Cambio de titularidad registral iniciado', required: true },
      { label: 'Liquidación ITP/AJD', required: true },
      { label: 'Entrega de llaves documentada', required: true },
      { label: 'Documentación archivada en Drive', required: true },
    ],
  },

  // ── ALQUILER (Propietario) ─────────────────────────────────────────────────
  {
    name: 'Documentación - Alquiler (Propietario)',
    operationType: 'ALQUILER', operationSize: 'INDIVIDUAL',
    clientType: 'PROPIETARIO',
    phase: 'DOCUMENTACION',
    items: [
      { label: 'DNI/NIE del propietario', required: true },
      { label: 'Escritura de propiedad', required: true },
      { label: 'Último recibo de IBI', required: true },
      { label: 'Cédula de habitabilidad vigente', required: true },
      { label: 'Certificado de eficiencia energética', required: true },
      { label: 'Certificado de no deudas con comunidad', required: false },
    ],
  },
  {
    name: 'Cierre - Alquiler',
    operationType: 'ALQUILER', operationSize: 'INDIVIDUAL',
    phase: 'CIERRE',
    items: [
      { label: 'Contrato de arrendamiento firmado', required: true },
      { label: 'Inventario de la vivienda firmado', required: true },
      { label: 'Depósito de fianza realizado', required: true },
      { label: 'Acta de entrega de llaves firmada', required: true },
      { label: 'Domiciliaciones bancarias tramitadas', required: false },
      { label: 'Seguro del hogar verificado', required: false },
    ],
  },

  // ── COMPRA ────────────────────────────────────────────────────────────────
  {
    name: 'Documentación - Compra',
    operationType: 'COMPRA', operationSize: 'INDIVIDUAL',
    phase: 'DOCUMENTACION',
    items: [
      { label: 'DNI/NIE del comprador', required: true },
      { label: 'CIRBE (informe central de riesgos)', required: true },
      { label: 'Extractos bancarios últimos 6 meses', required: true },
      { label: 'Últimas 3 nóminas', required: true },
      { label: 'Declaración de IRPF (último año)', required: true },
      { label: 'Preaprobación hipotecaria (si aplica)', required: false },
      { label: 'Contrato de trabajo vigente', required: false },
    ],
  },

  // ── INVERSIÓN / GRANDE ────────────────────────────────────────────────────
  {
    name: 'Documentación - Inversión/Grande',
    operationType: 'INVERSION', operationSize: 'GRANDE',
    phase: 'DOCUMENTACION',
    items: [
      { label: 'DNI/Pasaporte del inversor o representante', required: true },
      { label: 'Documentación societaria completa', required: true },
      { label: 'CIF de la empresa', required: true },
      { label: 'Escrituras del inmueble o portfolio', required: true },
      { label: 'Nota simple registral de cada activo', required: true },
      { label: 'Informe de due diligence técnica', required: true },
      { label: 'Tasación oficial (menos de 6 meses)', required: true },
      { label: 'Plan de negocio o memoria de inversión', required: true },
      { label: 'Certificado de cargas y gravámenes', required: true },
      { label: 'Informe de rentabilidad proyectada', required: false },
      { label: 'Licencias de actividad (si aplica)', required: false },
    ],
  },
  {
    name: 'Brief marketing - Premium/Grande',
    operationType: 'INVERSION', operationSize: 'GRANDE',
    phase: 'MARKETING_FORMULARIO',
    items: [
      { label: 'Descripción de lujo/premium redactada', required: true },
      { label: 'Autorización para fotografía profesional', required: true },
      { label: 'Autorización para vídeo y montaje', required: true },
      { label: 'Autorización para dron (si aplica)', required: false },
      { label: 'Autorización para tour virtual VR', required: false },
      { label: 'Briefing de posicionamiento de lujo', required: true },
      { label: 'Materiales de referencia del cliente', required: false },
    ],
  },
  {
    name: 'Ejecución marketing - Premium',
    operationType: 'INVERSION', operationSize: 'GRANDE',
    phase: 'MARKETING_EJECUCION',
    items: [
      { label: 'Sesión fotográfica profesional completada', required: true },
      { label: 'Plano 2D y 3D generado', required: true },
      { label: 'Render 3D completado', required: true },
      { label: 'Tour virtual VR completado', required: false },
      { label: 'Vídeo + montaje profesional', required: true },
      { label: 'Publicado en portales premium', required: true },
      { label: 'Presentación para inversores preparada', required: true },
    ],
  },

  // ── PROMOCIÓN / EDIFICIO ──────────────────────────────────────────────────
  {
    name: 'Documentación - Promoción/Edificio',
    operationType: 'PROMOCION', operationSize: 'GRANDE',
    phase: 'DOCUMENTACION',
    items: [
      { label: 'Licencia de obras y actividad', required: true },
      { label: 'Proyecto técnico visado', required: true },
      { label: 'Seguro decenal en vigor', required: true },
      { label: 'Memoria de calidades', required: true },
      { label: 'Libro del edificio', required: true },
      { label: 'Contratos con la constructora', required: true },
      { label: 'Certificado final de obra', required: false },
      { label: 'Cédulas de habitabilidad (por unidad)', required: false },
      { label: 'Escrituras de división horizontal', required: true },
      { label: 'Estatutos de la comunidad', required: false },
    ],
  },
];

// ─── Plantillas de email ──────────────────────────────────────────────────────
const EMAIL_TEMPLATES = [
  {
    name: 'Apertura de expediente',
    type: 'APERTURA_EXPEDIENTE',
    subject: 'Nuevo expediente abierto: {{expedientCode}}',
    variables: ['expedientCode', 'clientName', 'operationType', 'propertyAddress', 'recipientName', 'agencyName'],
    bodyHtml: `<p>Hola <strong>{{recipientName}}</strong>,</p>
<p>Se ha abierto un nuevo expediente en el CRM:</p>
<p><strong>Referencia:</strong> {{expedientCode}}</p>
<p><strong>Cliente:</strong> {{clientName}}</p>
<p><strong>Operación:</strong> {{operationType}}</p>
<p><strong>Inmueble:</strong> {{propertyAddress}}</p>
<p>Accede al CRM para gestionar este expediente.</p>
<p>Un saludo,<br>{{agencyName}}</p>`,
  },
  {
    name: 'Cambio de fase',
    type: 'FASE_COMPLETADA',
    subject: '[{{expedientCode}}] Nueva fase: {{toPhase}}',
    variables: ['expedientCode', 'clientName', 'fromPhase', 'toPhase', 'recipientName', 'agencyName'],
    bodyHtml: `<p>Hola <strong>{{recipientName}}</strong>,</p>
<p>El expediente <strong>{{expedientCode}}</strong> ha avanzado:</p>
<p><strong>De:</strong> {{fromPhase}} → <strong>A:</strong> {{toPhase}}</p>
<p><strong>Cliente:</strong> {{clientName}}</p>
<p>Accede al CRM para ver las tareas pendientes en esta nueva fase.</p>
<p>Un saludo,<br>{{agencyName}}</p>`,
  },
  {
    name: 'Expediente bloqueado',
    type: 'BLOQUEO_DETECTADO',
    subject: '⚠️ [{{expedientCode}}] Expediente bloqueado - Acción requerida',
    variables: ['expedientCode', 'clientName', 'blockReason', 'recipientName', 'agencyName'],
    bodyHtml: `<p>Hola <strong>{{recipientName}}</strong>,</p>
<p>El expediente <strong>{{expedientCode}}</strong> está bloqueado y requiere tu atención.</p>
<p><strong>Motivo:</strong> {{blockReason}}</p>
<p>Por favor, accede al CRM y resuelve la incidencia para continuar con el proceso.</p>
<p>Un saludo,<br>{{agencyName}}</p>`,
  },
  {
    name: 'Operación cerrada',
    type: 'OPERACION_CERRADA',
    subject: '✅ [{{expedientCode}}] Operación cerrada con éxito',
    variables: ['expedientCode', 'clientName', 'operationType', 'propertyAddress', 'recipientName', 'agencyName'],
    bodyHtml: `<p>Hola <strong>{{recipientName}}</strong>,</p>
<p>🎉 La operación <strong>{{expedientCode}}</strong> ha sido cerrada con éxito.</p>
<p><strong>Cliente:</strong> {{clientName}}</p>
<p><strong>Operación:</strong> {{operationType}}</p>
<p><strong>Inmueble:</strong> {{propertyAddress}}</p>
<p>Accede al CRM para completar el archivo y trámites de cierre.</p>
<p>Un saludo,<br>{{agencyName}}</p>`,
  },
  {
    name: 'Postventa 3 meses',
    type: 'POSVENTA_3_MESES',
    subject: '¡3 meses de su operación con {{agencyName}}!',
    variables: ['clientName', 'agencyName', 'expedientCode'],
    bodyHtml: `<p>Estimado/a <strong>{{clientName}}</strong>,</p>
<p>Han pasado ya <strong>3 meses</strong> desde el cierre de su operación y queríamos saludarle.</p>
<p>Esperamos que todo vaya a la perfección. Si necesita cualquier gestión, estamos a su disposición.</p>
<p>Un cordial saludo,<br>El equipo de {{agencyName}}</p>`,
  },
  {
    name: 'Postventa 6 meses',
    type: 'POSVENTA_6_MESES',
    subject: '¡6 meses de su operación con {{agencyName}}!',
    variables: ['clientName', 'agencyName'],
    bodyHtml: `<p>Estimado/a <strong>{{clientName}}</strong>,</p>
<p>Hoy se cumplen <strong>6 meses</strong> desde el cierre de su operación.</p>
<p>¡Esperamos que esté disfrutando de esta nueva etapa! Si en algún momento necesita asesoramiento inmobiliario, recuerde que estamos aquí.</p>
<p>Un cordial saludo,<br>El equipo de {{agencyName}}</p>`,
  },
  {
    name: 'Postventa 12 meses - Solicitud de reseña',
    type: 'POSVENTA_12_MESES',
    subject: '🎂 ¡Un año de su operación! Le pedimos su opinión',
    variables: ['clientName', 'agencyName', 'reviewUrl', 'trustpilotUrl'],
    bodyHtml: `<p>Estimado/a <strong>{{clientName}}</strong>,</p>
<p>🎉 ¡Hoy se cumple exactamente <strong>1 año</strong> desde que cerramos su operación juntos!</p>
<p>Ha sido un privilegio trabajar con usted. Si tiene unos minutos, su opinión nos ayuda a seguir mejorando y a llegar a más personas:</p>
<p><a href="{{reviewUrl}}">⭐ Dejar reseña en Google</a></p>
<p>¡Muchas gracias y hasta pronto!<br>El equipo de {{agencyName}}</p>`,
  },
];

// ─── Función principal ────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  // Usuarios
  for (const userData of USERS) {
    const hashed = await bcrypt.hash(userData.password, 12);
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: { ...userData, password: hashed },
    });
    console.log(`  ✓ Usuario: ${userData.email} (${userData.role})`);
  }

  // Plantillas de checklist
  for (const tpl of CHECKLIST_TEMPLATES) {
    const { items, ...templateData } = tpl;
    const existing = await prisma.checklistTemplate.findFirst({
      where: {
        name: templateData.name,
        operationType: templateData.operationType,
        phase: templateData.phase,
      },
    });

    if (!existing) {
      await prisma.checklistTemplate.create({
        data: {
          ...templateData,
          items: {
            create: items.map((item, i) => ({ ...item, order: i })),
          },
        },
      });
      console.log(`  ✓ Checklist: ${templateData.name}`);
    } else {
      console.log(`  → Ya existe: ${templateData.name}`);
    }
  }

  // Plantillas de email
  for (const emailTpl of EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { id: 'seed-' + emailTpl.type },
      update: { subject: emailTpl.subject, bodyHtml: emailTpl.bodyHtml },
      create: { id: 'seed-' + emailTpl.type, ...emailTpl },
    });
    console.log(`  ✓ Email template: ${emailTpl.name}`);
  }

  console.log('\n✅ Seed completado.');
  console.log('\n📋 Credenciales iniciales:');
  USERS.forEach(u => console.log(`   ${u.role.padEnd(15)} ${u.email.padEnd(35)} Pass: ${u.password}`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());
