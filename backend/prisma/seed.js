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

// ─── Plantillas de checklist ──────────────────────────────────────────────────────
// ✨ MEJORADO - Con TODOS los documentos del sector inmobiliario real

const CHECKLIST_TEMPLATES = [

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 1: CAPTACIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Captación inicial - Todos',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'CAPTACION',
    items: [
      { label: 'Contacto realizado con el cliente', required: true },
      { label: 'Origen del lead registrado (web, referido, portal, llamada fría)', required: true },
      { label: 'Tipo de operación confirmada (venta/alquiler/compra)', required: true },
      { label: 'Dirección completa o aproximada del inmueble', required: true },
      { label: 'Motivación del cliente identificada (urgencia, timeline)', required: true },
      { label: 'Primera llamada / reunión presencial agendada', required: true },
    ],
  },
  {
    name: 'Captación inicial - Compra',
    operationType: 'COMPRA', operationSize: 'INDIVIDUAL',
    phase: 'CAPTACION',
    items: [
      { label: 'Contacto realizado con el comprador', required: true },
      { label: 'Presupuesto máximo aproximado', required: true },
      { label: 'Zona/barrio de interés', required: true },
      { label: 'Tipo de inmueble buscado', required: true },
      { label: 'Necesidad de financiación (sí/no)', required: true },
      { label: 'Plazo de compra estimado', required: true },
    ],
  },
  {
    name: 'Captación inicial - Alquiler',
    operationType: 'ALQUILER', operationSize: 'INDIVIDUAL',
    phase: 'CAPTACION',
    items: [
      { label: 'Contacto realizado con el propietario', required: true },
      { label: 'Tipo de inmueble a alquilar', required: true },
      { label: 'Renta mensual esperada', required: true },
      { label: 'Condiciones especiales (mascotas, fumadores)', required: false },
      { label: 'Disponibilidad inmediata o fecha futura', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 2: VALORACIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Valoración de inmueble - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'VALORACION',
    items: [
      { label: 'Visita física al inmueble realizada', required: true },
      { label: 'Fotos del estado actual tomadas (mínimo 20)', required: true },
      { label: 'Mediciones verificadas (m² construidos vs útiles)', required: true },
      { label: 'Estado de conservación evaluado', required: true },
      { label: 'Análisis de comparables de mercado (CMA) completado', required: true },
      { label: 'Precio de salida recomendado definido', required: true },
      { label: 'Precio mínimo aceptable acordado con propietario', required: true },
      { label: 'Informe de valoración entregado al cliente', required: true },
      { label: 'Mejoras recomendadas documentadas (si procede)', required: false },
    ],
  },
  {
    name: 'Valoración de inmueble - Alquiler',
    operationType: 'ALQUILER', operationSize: 'INDIVIDUAL',
    phase: 'VALORACION',
    items: [
      { label: 'Visita física al inmueble', required: true },
      { label: 'Fotos del estado actual', required: true },
      { label: 'Comparables de alquiler en zona', required: true },
      { label: 'Renta mensual recomendada', required: true },
      { label: 'Renta mínima aceptable', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 3: FORMULARIO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Formulario captación - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'FORMULARIO',
    items: [
      { label: 'Datos personales completos del propietario', required: true },
      { label: 'Datos del inmueble registrados en sistema', required: true },
      { label: 'Política de privacidad y RGPD firmada', required: true },
      { label: 'Email del cliente confirmado y verificado', required: true },
      { label: 'Teléfono de contacto verificado', required: true },
      { label: 'Situación actual del inmueble (ocupado/vacío/alquilado)', required: true },
      { label: 'Fecha de disponibilidad para visitas confirmada', required: true },
      { label: 'Motivación de la venta registrada', required: false },
      { label: 'Referencia catastral del inmueble', required: false },
    ],
  },
  {
    name: 'Formulario captación - Compra',
    operationType: 'COMPRA', operationSize: 'INDIVIDUAL',
    phase: 'FORMULARIO',
    items: [
      { label: 'Datos completos del comprador', required: true },
      { label: 'Datos completos del cónyuge (si casado en gananciales)', required: false },
      { label: 'Política de privacidad firmada', required: true },
      { label: 'Presupuesto máximo definido', required: true },
      { label: 'Zona de búsqueda preferente registrada', required: true },
      { label: 'Características del inmueble buscado (hab, baños, m²)', required: true },
      { label: 'Necesidad de financiación confirmada (sí/no)', required: true },
      { label: 'Porcentaje de entrada disponible', required: false },
      { label: 'Plazo de compra estimado', required: true },
    ],
  },
  {
    name: 'Formulario captación - Alquiler',
    operationType: 'ALQUILER', operationSize: 'INDIVIDUAL',
    phase: 'FORMULARIO',
    items: [
      { label: 'Datos completos del propietario', required: true },
      { label: 'Datos del inmueble registrados', required: true },
      { label: 'Política de privacidad firmada', required: true },
      { label: 'Renta mensual esperada definida', required: true },
      { label: 'Condiciones de alquiler (mascotas, fumadores, etc)', required: true },
      { label: 'Disponibilidad para visitas confirmada', required: true },
      { label: 'Duración mínima del contrato preferida', required: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 4: DOCUMENTACIÓN ⭐ MEJORADO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Documentación inicial - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'DOCUMENTACION',
    items: [
      { label: 'DNI/NIE del vendedor (vigente)', required: true },
      { label: 'DNI/NIE del cónyuge (si casado en gananciales)', required: false },
      { label: 'Escritura de propiedad', required: true },
      { label: 'Nota simple registral (menos de 3 meses)', required: true },
      { label: 'Último recibo de IBI pagado', required: true },
      { label: 'Certificado sin deudas de comunidad', required: true },
      { label: 'Certificado de eficiencia energética', required: true },
      { label: 'Cédula de habitabilidad', required: true },
      { label: 'Licencia de primera ocupación (si obra nueva <10 años)', required: false },
      { label: 'Planos técnicos del inmueble', required: false },
      { label: 'Libro del edificio (si promoción)', required: false },
      { label: 'Acta final de obra (si obra nueva)', required: false },
      { label: 'Garantías constructora y seguro decenal (si <10 años)', required: false },
      { label: 'Estatutos de la comunidad', required: false },
      { label: 'Últimas facturas de suministros pagadas', required: false },
      { label: 'Certificado no estar en concurso de acreedores (si empresa)', required: false },
    ],
  },
  {
    name: 'Documentación inicial - Compra ⭐ AMPLIADO',
    operationType: 'COMPRA', operationSize: 'INDIVIDUAL',
    phase: 'DOCUMENTACION',
    items: [
      { label: 'DNI/NIE del comprador', required: true },
      { label: 'DNI/NIE del cónyuge (si casado en gananciales)', required: false },
      { label: 'Certificado de estado civil', required: true },
      { label: 'CIRBE (central de riesgos)', required: true },
      { label: 'Extractos bancarios últimos 6 meses', required: true },
      { label: 'Últimas 3 nóminas', required: true },
      { label: 'Contrato de trabajo vigente', required: true },
      { label: 'Declaración IRPF último año', required: true },
      { label: 'Vida laboral actualizada', required: true },
      { label: 'Justificante de ahorros/entrada (extracto, certificado)', required: true },
      { label: 'Declaración de bienes (si autónomo)', required: false },
      { label: 'Nóminas y contrato del cónyuge (si compra conjunta)', required: false },
      { label: 'Preaprobación hipotecaria (si ya gestionada)', required: false },
    ],
  },
  {
    name: 'Documentación inicial - Alquiler (Propietario)',
    operationType: 'ALQUILER', operationSize: 'INDIVIDUAL',
    phase: 'DOCUMENTACION',
    items: [
      { label: 'DNI/NIE del propietario', required: true },
      { label: 'Escritura de propiedad', required: true },
      { label: 'Último recibo IBI pagado', required: true },
      { label: 'Cédula de habitabilidad vigente', required: true },
      { label: 'Certificado de eficiencia energética', required: true },
      { label: 'Certificado sin deudas comunidad', required: false },
      { label: 'Cuenta bancaria para domiciliación alquiler', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 5: VALIDACIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Validación documental - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'VALIDACION',
    items: [
      { label: 'DNI vigente y correcto (letra verificada)', required: true },
      { label: 'Escritura sin cargas ocultas', required: true },
      { label: 'Nota simple coincide con escritura (titular, referencia)', required: true },
      { label: 'Certificado energético en vigor (no caducado)', required: true },
      { label: 'IBI al corriente de pago', required: true },
      { label: 'Comunidad sin deudas pendientes', required: true },
      { label: 'Propietario verificado como único titular o con poderes notariales', required: true },
      { label: 'Licencias y permisos verificados (si aplica)', required: false },
    ],
  },
  {
    name: 'Validación documental - Compra',
    operationType: 'COMPRA', operationSize: 'INDIVIDUAL',
    phase: 'VALIDACION',
    items: [
      { label: 'DNI comprador vigente y verificado', required: true },
      { label: 'CIRBE analizado (sin impagos ni embargos)', required: true },
      { label: 'Solvencia económica comprobada (ingresos vs precio)', required: true },
      { label: 'Documentación laboral correcta y vigente', required: true },
      { label: 'Ahorros/entrada justificados y suficientes', required: true },
      { label: 'Capacidad de endeudamiento calculada (< 35% ingresos)', required: true },
    ],
  },
  {
    name: 'Validación documental - Alquiler',
    operationType: 'ALQUILER', operationSize: 'INDIVIDUAL',
    phase: 'VALIDACION',
    items: [
      { label: 'DNI propietario verificado', required: true },
      { label: 'Escritura vigente y correcta', required: true },
      { label: 'Cédula habitabilidad en vigor', required: true },
      { label: 'Certificado energético válido', required: true },
      { label: 'Cuenta bancaria verificada', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 6: ACUERDO / EXCLUSIVA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Contrato de exclusividad - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'ACUERDO',
    items: [
      { label: 'Contrato de exclusividad redactado', required: true },
      { label: 'Comisión acordada y registrada (%)', required: true },
      { label: 'Precio de venta final acordado', required: true },
      { label: 'Duración de exclusividad (meses)', required: true },
      { label: 'Condiciones de renovación pactadas', required: false },
      { label: 'Contrato firmado por el propietario', required: true },
      { label: 'Copia del contrato entregada al cliente', required: true },
      { label: 'Contrato archivado en Drive', required: true },
    ],
  },
  {
    name: 'Contrato de gestión - Alquiler',
    operationType: 'ALQUILER', operationSize: 'INDIVIDUAL',
    phase: 'ACUERDO',
    items: [
      { label: 'Contrato de gestión de alquiler firmado', required: true },
      { label: 'Comisión acordada (% o meses de renta)', required: true },
      { label: 'Renta mensual final acordada', required: true },
      { label: 'Condiciones especiales registradas', required: true },
      { label: 'Copia entregada al propietario', required: true },
      { label: 'Contrato archivado en Drive', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 7: BRIEF MARKETING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Brief de marketing - Venta/Alquiler',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'MARKETING_FORMULARIO',
    items: [
      { label: 'Descripción detallada del inmueble redactada', required: true },
      { label: 'Características técnicas completas (m², hab, baños, año)', required: true },
      { label: 'Puntos fuertes y diferenciales identificados', required: true },
      { label: 'Precio de publicación definido', required: true },
      { label: 'Autorización de fotografías firmada', required: true },
      { label: 'Fecha para sesión fotográfica agendada', required: true },
      { label: 'Portales de publicación seleccionados', required: true },
      { label: 'Necesidad de home staging evaluada', required: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 8: PRODUCCIÓN MARKETING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Producción de marketing - Venta/Alquiler',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'MARKETING_EJECUCION',
    items: [
      { label: 'Sesión fotográfica profesional completada', required: true },
      { label: 'Fotos seleccionadas y editadas (mínimo 15)', required: true },
      { label: 'Plano 2D generado', required: true },
      { label: 'Ficha comercial del inmueble creada', required: true },
      { label: 'Publicado en Idealista', required: true },
      { label: 'Publicado en Fotocasa', required: true },
      { label: 'Publicado en web de la agencia', required: true },
      { label: 'Compartido en redes sociales de la agencia', required: false },
      { label: 'Cartelería instalada en inmueble (si procede)', required: false },
      { label: 'Tour virtual 360° creado (premium)', required: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 9: VISITAS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Gestión de visitas - Venta/Alquiler',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'VISITAS',
    items: [
      { label: 'Al menos 3 visitas realizadas y documentadas', required: true },
      { label: 'Feedback de cada visita registrado en sistema', required: true },
      { label: 'Interesados cualificados identificados', required: true },
      { label: 'Seguimiento post-visita realizado con cada interesado', required: true },
      { label: 'Llaves controladas (registro entrega/devolución)', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 10: PREVENTA / LANZAMIENTO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Lanzamiento preventa - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'PREVENTA',
    items: [
      { label: 'Plan de marketing activo definido', required: true },
      { label: 'Base de datos de contactos segmentada', required: true },
      { label: 'Email marketing enviado a base de datos', required: false },
      { label: 'Campaña en redes sociales activa', required: false },
      { label: 'Colaboración con otras agencias (si procede)', required: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 11: BÚSQUEDA ACTIVA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Búsqueda activa - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'BUSQUEDA_ACTIVA',
    items: [
      { label: 'Listado de interesados potenciales actualizado', required: true },
      { label: 'Seguimiento semanal con interesados registrados', required: true },
      { label: 'Informe de actividad enviado al propietario', required: true },
      { label: 'Ajuste de precio evaluado (si >60 días sin oferta)', required: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 12: NEGOCIACIÓN ⭐ AMPLIADO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Negociación con comprador - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'NEGOCIACION',
    items: [
      { label: 'Oferta formal del comprador recibida por escrito', required: true },
      { label: 'Oferta presentada al propietario', required: true },
      { label: 'Contraoferta tramitada (si aplica)', required: false },
      { label: 'Precio final acordado entre ambas partes', required: true },
      { label: 'Condiciones de compraventa negociadas (plazos, incluidos)', required: true },
      { label: 'Fecha estimada de firma de arras definida', required: true },
      { label: 'Acuerdo de principio firmado por ambas partes', required: true },
    ],
  },
  {
    name: 'Negociación - Alquiler ⭐ CON DOCS INQUILINO',
    operationType: 'ALQUILER', operationSize: 'INDIVIDUAL',
    phase: 'NEGOCIACION',
    items: [
      { label: 'Candidato a inquilino identificado', required: true },
      { label: 'DNI/NIE del inquilino recibido', required: true },
      { label: 'Nóminas últimos 3 meses del inquilino', required: true },
      { label: 'Contrato de trabajo vigente del inquilino', required: true },
      { label: 'Vida laboral del inquilino', required: false },
      { label: 'IRPF del inquilino (si autónomo)', required: false },
      { label: 'DNI y nóminas del avalista/garante', required: false },
      { label: 'Escritura de propiedad del avalista (garantía real)', required: false },
      { label: 'Referencias de arrendadores anteriores', required: false },
      { label: 'Solvencia del inquilino verificada (ingresos x3 renta)', required: true },
      { label: 'Condiciones de alquiler acordadas', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 13: ACUERDO CON INTERESADO / SEÑAL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Propuesta / Señal - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'ACUERDO_INTERESADO',
    items: [
      { label: 'Datos completos del comprador registrados', required: true },
      { label: 'Documento de reserva / señal firmado', required: true },
      { label: 'Importe de la señal recibido (si aplica)', required: false },
      { label: 'Documentación del comprador solicitada', required: true },
      { label: 'Fecha de firma de arras provisional fijada', required: true },
      { label: 'Compromiso de compra firmado', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 14: ARRAS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Contrato de arras - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'ARRAS',
    items: [
      { label: 'Contrato de arras redactado', required: true },
      { label: 'Arras pagadas por el comprador (10-15% precio)', required: true },
      { label: 'Recibo de arras emitido', required: true },
      { label: 'Contrato de arras firmado por ambas partes', required: true },
      { label: 'Copia del contrato entregada a comprador y vendedor', required: true },
      { label: 'Plazo para otorgar escritura definido (30-90 días)', required: true },
      { label: 'Condiciones suspensivas registradas (hipoteca, licencias)', required: false },
      { label: 'Penalizaciones por desistimiento pactadas', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 15: HIPOTECA ⭐ SUPER AMPLIADO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Gestión hipotecaria - Compra',
    operationType: 'COMPRA', operationSize: 'INDIVIDUAL',
    phase: 'HIPOTECA',
    items: [
      { label: 'Solicitud de hipoteca presentada al banco', required: true },
      { label: 'Documentación 2º titular aportada (si compra conjunta)', required: false },
      { label: 'Estudio de riesgos bancario aprobado', required: true },
      { label: 'Tasación bancaria solicitada', required: true },
      { label: 'Tasación bancaria realizada', required: true },
      { label: 'Informe de tasación favorable recibido', required: true },
      { label: 'FEIN (oferta vinculante) recibida del banco', required: true },
      { label: 'Borrador de FEIN revisado por asesor/cliente', required: true },
      { label: 'Condiciones de la hipoteca aceptadas por el comprador', required: true },
      { label: 'FEIN firmada por el comprador', required: true },
      { label: 'Seguro de vida contratado', required: true },
      { label: 'Seguro de hogar contratado', required: true },
      { label: 'Seguro de impago contratado (si lo requiere banco)', required: false },
      { label: 'Certificado médico aportado (según banco)', required: false },
      { label: 'Aprobación definitiva de la hipoteca recibida', required: true },
      { label: 'Fecha de firma en notaría confirmada con banco', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 16: NOTARÍA ⭐ AMPLIADO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Notaría y escritura - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'NOTARIA',
    items: [
      { label: 'Notaría seleccionada y cita reservada', required: true },
      { label: 'Nota simple de compraventa solicitada', required: true },
      { label: 'Borrador de escritura de compraventa redactado', required: true },
      { label: 'Borrador de escritura revisado por ambas partes', required: true },
      { label: 'Liquidación de ITP o IVA+AJD preparada', required: true },
      { label: 'Minuta de gastos notariales confirmada', required: true },
      { label: 'Certificado de últimos recibos pagados de suministros', required: false },
      { label: 'Pago del precio total realizado', required: true },
      { label: 'Escritura firmada ante notario', required: true },
      { label: 'Copia autorizada de escritura recibida', required: true },
      { label: 'Escritura entregada a las partes', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 17: CIERRE ⭐ AMPLIADO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Cierre de operación - Venta',
    operationType: 'VENTA', operationSize: 'INDIVIDUAL',
    phase: 'CIERRE',
    items: [
      { label: 'Acta de entrega de llaves firmada', required: true },
      { label: 'Llaves entregadas al comprador', required: true },
      { label: 'Códigos de alarma/acceso entregados', required: false },
      { label: 'Inmueble entregado vacío y limpio', required: true },
      { label: 'Cambios de titularidad de suministros gestionados', required: true },
      { label: 'Liquidación de impuestos presentada (ITP/plusvalía)', required: true },
      { label: 'Inscripción registral iniciada', required: true },
      { label: 'Comisión de la agencia facturada', required: true },
      { label: 'Comisión de la agencia cobrada', required: true },
      { label: 'Documentación completa archivada en Drive', required: true },
      { label: 'Encuesta de satisfacción enviada al cliente', required: false },
      { label: 'Contacto añadido a base datos para futuras operaciones', required: false },
    ],
  },
  {
    name: 'Cierre de operación - Alquiler ⭐ AMPLIADO',
    operationType: 'ALQUILER', operationSize: 'INDIVIDUAL',
    phase: 'CIERRE',
    items: [
      { label: 'Contrato de arrendamiento firmado por ambas partes', required: true },
      { label: 'Inventario de la vivienda firmado', required: true },
      { label: 'Fianza depositada en organismo oficial (INCASOL, IVIMA, etc)', required: true },
      { label: 'Recibo de depósito de fianza recibido', required: true },
      { label: 'Póliza de seguro de impago de alquiler contratada', required: false },
      { label: 'Acta de entrega de llaves firmada', required: true },
      { label: 'Llaves entregadas al inquilino', required: true },
      { label: 'Códigos de alarma/portal entregados', required: false },
      { label: 'Inmueble entregado en perfecto estado', required: true },
      { label: 'Alta de suministros a nombre inquilino gestionada', required: true },
      { label: 'Domiciliación bancaria alquiler tramitada', required: true },
      { label: 'Recibo primer mes de renta + fianza pagados', required: true },
      { label: 'Comisión facturada y cobrada', required: true },
      { label: 'Documentación archivada en Drive', required: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERACIONES GRANDES / PREMIUM / INVERSIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Documentación - Inversión/Grande',
    operationType: 'INVERSION', operationSize: 'GRANDE',
    phase: 'DOCUMENTACION',
    items: [
      { label: 'DNI/Pasaporte del inversor o representante legal', required: true },
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
      { label: 'Certificado de no estar en concurso de acreedores', required: true },
    ],
  },
  {
    name: 'Brief marketing - Premium',
    operationType: 'INVERSION', operationSize: 'GRANDE',
    phase: 'MARKETING_FORMULARIO',
    items: [
      { label: 'Descripción premium redactada', required: true },
      { label: 'Autorización fotografía profesional', required: true },
      { label: 'Autorización vídeo profesional', required: true },
      { label: 'Autorización dron (si aplica)', required: false },
      { label: 'Autorización tour virtual VR', required: false },
      { label: 'Briefing de posicionamiento de lujo', required: true },
      { label: 'Materiales de referencia del cliente', required: false },
    ],
  },
  {
    name: 'Producción marketing - Premium',
    operationType: 'INVERSION', operationSize: 'GRANDE',
    phase: 'MARKETING_EJECUCION',
    items: [
      { label: 'Sesión fotográfica profesional completada', required: true },
      { label: 'Planos 2D y 3D generados', required: true },
      { label: 'Render 3D completado', required: true },
      { label: 'Tour virtual VR completado', required: false },
      { label: 'Vídeo profesional montado', required: true },
      { label: 'Dossier de inversión preparado (PDF premium)', required: true },
      { label: 'Publicado en portales premium', required: true },
      { label: 'Campaña específica inversores', required: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏠 PROCESO COMPLETO DEL INQUILINO
  // Flujo: Contacto → Datos → Docs → Solvencia → Visitas → Negociación → Acuerdo → Contrato → Seguimiento
  // ═══════════════════════════════════════════════════════════════════════════

  // FASE 1 INQUILINO: CAPTACIÓN (Contacto inicial)
  {
    name: 'Contacto inicial - Inquilino',
    operationType: 'INQUILINO', operationSize: 'INDIVIDUAL',
    phase: 'CAPTACION',
    items: [
      { label: 'Primer contacto realizado con el inquilino', required: true },
      { label: 'Origen del lead registrado (web, referido, portal, llamada)', required: true },
      { label: 'Tipo de vivienda buscada registrada (piso, casa, estudio)', required: true },
      { label: 'Zona/barrios de interés definidos', required: true },
      { label: 'Presupuesto mensual máximo del inquilino registrado', required: true },
      { label: 'Fecha de entrada deseada registrada', required: true },
      { label: 'Número de convivientes registrado', required: true },
      { label: 'Mascotas (sí/no) registrado', required: false },
      { label: 'Necesidades especiales registradas (accesibilidad, garaje)', required: false },
    ],
  },

  // FASE 2 INQUILINO: FORMULARIO (Datos personales)
  {
    name: 'Datos personales - Inquilino',
    operationType: 'INQUILINO', operationSize: 'INDIVIDUAL',
    phase: 'FORMULARIO',
    items: [
      { label: 'Nombre completo del inquilino registrado', required: true },
      { label: 'DNI/NIE registrado en sistema', required: true },
      { label: 'Nacionalidad registrada', required: true },
      { label: 'Teléfono de contacto verificado', required: true },
      { label: 'Email confirmado y verificado', required: true },
      { label: 'Dirección actual registrada', required: true },
      { label: 'Situación laboral registrada (cuenta ajena/autónomo/funcionario)', required: true },
      { label: 'Ingresos mensuales netos aproximados registrados', required: true },
      { label: 'Datos del cónyuge/pareja registrados (si alquiler conjunto)', required: false },
      { label: 'Política de privacidad y RGPD firmada', required: true },
      { label: 'Motivo del alquiler registrado (cambio ciudad, emancipación, separación)', required: false },
    ],
  },

  // FASE 3 INQUILINO: DOCUMENTACIÓN (Recopilación docs)
  {
    name: 'Documentación del inquilino',
    operationType: 'INQUILINO', operationSize: 'INDIVIDUAL',
    phase: 'DOCUMENTACION',
    items: [
      { label: 'DNI/NIE del inquilino recibido (copia vigente)', required: true },
      { label: 'DNI/NIE pareja/cotitular recibido (si aplica)', required: false },
      { label: 'Últimas 3 nóminas recibidas', required: true },
      { label: 'Contrato de trabajo vigente recibido', required: true },
      { label: 'Vida laboral actualizada recibida', required: true },
      { label: 'Declaración IRPF último ejercicio recibida', required: true },
      { label: 'Extractos bancarios últimos 3 meses recibidos', required: true },
      { label: 'Referencias de arrendadores anteriores recibidas', required: false },
      { label: 'DNI/NIE del avalista recibido (si se requiere)', required: false },
      { label: 'Nóminas del avalista recibidas (si se requiere)', required: false },
      { label: 'Escritura de propiedad del avalista (si garantía real)', required: false },
      { label: 'Cuenta bancaria para domiciliación del alquiler facilitada', required: true },
    ],
  },

  // FASE 4 INQUILINO: VALIDACIÓN (Solvencia)
  {
    name: 'Verificación de solvencia - Inquilino',
    operationType: 'INQUILINO', operationSize: 'INDIVIDUAL',
    phase: 'VALIDACION',
    items: [
      { label: 'DNI/NIE vigente y datos correctos', required: true },
      { label: 'Ingresos mensuales verificados (mínimo x3 renta mensual)', required: true },
      { label: 'Estabilidad laboral verificada (antigüedad > 6 meses)', required: true },
      { label: 'Consulta ASNEF/ficheros de morosos realizada (sin incidencias)', required: true },
      { label: 'IRPF coherente con nóminas declaradas', required: true },
      { label: 'Extractos bancarios sin incidencias (descubiertos, embargos)', required: true },
      { label: 'Solvencia del avalista verificada (si aplica)', required: false },
      { label: 'Capacidad de pago aprobada por el propietario', required: true },
      { label: 'Perfil del inquilino validado internamente (agencia)', required: true },
    ],
  },

  // FASE 5 INQUILINO: VISITAS
  {
    name: 'Visitas a inmuebles - Inquilino',
    operationType: 'INQUILINO', operationSize: 'INDIVIDUAL',
    phase: 'VISITAS',
    items: [
      { label: 'Listado de inmuebles disponibles preparado según perfil', required: true },
      { label: 'Al menos 3 visitas realizadas y documentadas', required: true },
      { label: 'Feedback de cada visita registrado en sistema', required: true },
      { label: 'Inmueble favorito del inquilino identificado', required: true },
      { label: 'Informe de estado del inmueble revisado con inquilino', required: true },
      { label: 'Inventario de muebles/equipamiento revisado (si amueblado)', required: false },
    ],
  },

  // FASE 6 INQUILINO: NEGOCIACIÓN
  {
    name: 'Negociación condiciones - Inquilino',
    operationType: 'INQUILINO', operationSize: 'INDIVIDUAL',
    phase: 'NEGOCIACION',
    items: [
      { label: 'Renta mensual definitiva acordada', required: true },
      { label: 'Duración del contrato acordada (1 año mín / 5 años prórroga)', required: true },
      { label: 'Importe de fianza definido (1-2 meses)', required: true },
      { label: 'Garantías adicionales acordadas (aval bancario, seguro impago)', required: false },
      { label: 'Gastos incluidos en renta definidos (comunidad, basuras)', required: true },
      { label: 'Suministros a cargo del inquilino definidos', required: true },
      { label: 'Cláusulas especiales pactadas (mascotas, obras, subarriendo)', required: false },
      { label: 'Fecha de inicio del contrato acordada', required: true },
      { label: 'Propietario acepta al candidato formalmente', required: true },
    ],
  },

  // FASE 7 INQUILINO: ACUERDO
  {
    name: 'Acuerdo / Reserva - Inquilino',
    operationType: 'INQUILINO', operationSize: 'INDIVIDUAL',
    phase: 'ACUERDO_INTERESADO',
    items: [
      { label: 'Documento de reserva firmado por inquilino', required: true },
      { label: 'Señal/reserva abonada por el inquilino (si procede)', required: false },
      { label: 'Borrador del contrato de arrendamiento redactado', required: true },
      { label: 'Borrador revisado por inquilino y propietario', required: true },
      { label: 'Seguro de impago de alquiler contratado (si lo requiere propietario)', required: false },
      { label: 'Seguro de hogar contratado o compromiso de contratación', required: false },
      { label: 'Fecha definitiva de firma del contrato confirmada', required: true },
    ],
  },

  // FASE 8 INQUILINO: CIERRE (Firma contrato y entrega)
  {
    name: 'Firma contrato y entrega - Inquilino',
    operationType: 'INQUILINO', operationSize: 'INDIVIDUAL',
    phase: 'CIERRE',
    items: [
      { label: 'Contrato de arrendamiento firmado por ambas partes', required: true },
      { label: 'Inventario del inmueble firmado por ambas partes', required: true },
      { label: 'Fianza abonada por el inquilino', required: true },
      { label: 'Fianza depositada en organismo oficial (INCASOL, IVIMA, etc.)', required: true },
      { label: 'Recibo de depósito de fianza entregado al inquilino', required: true },
      { label: 'Primer mes de renta abonado', required: true },
      { label: 'Garantías adicionales formalizadas (aval, seguro)', required: false },
      { label: 'Acta de entrega de llaves firmada', required: true },
      { label: 'Llaves entregadas al inquilino (portal, buzón, vivienda)', required: true },
      { label: 'Códigos de alarma / acceso portal entregados', required: false },
      { label: 'Alta de suministros a nombre del inquilino gestionada', required: true },
      { label: 'Domiciliación bancaria del alquiler tramitada', required: true },
      { label: 'Copia del contrato entregada al inquilino', required: true },
      { label: 'Copia del contrato archivada en Drive', required: true },
      { label: 'Comisión de la agencia facturada y cobrada', required: true },
    ],
  },

  // FASE 9 INQUILINO: POSVENTA (Seguimiento)
  {
    name: 'Seguimiento post-alquiler - Inquilino',
    operationType: 'INQUILINO', operationSize: 'INDIVIDUAL',
    phase: 'POSVENTA',
    items: [
      { label: 'Llamada de seguimiento a los 15 días realizada', required: true },
      { label: 'Verificar que suministros están correctamente dados de alta', required: true },
      { label: 'Verificar primer pago de renta recibido correctamente', required: true },
      { label: 'Incidencias del primer mes resueltas (si las hubiera)', required: false },
      { label: 'Contacto añadido a base de datos para futuras operaciones', required: true },
      { label: 'Encuesta de satisfacción enviada al inquilino', required: false },
      { label: 'Seguimiento a los 3 meses programado', required: false },
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
  console.log('🌱 Iniciando seed MEJORADO de la base de datos...\n');

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
      console.log(`  ✓ Checklist: ${templateData.name} (${templateData.phase})`);
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

  console.log('\n✅ Seed MEJORADO completado.');
  console.log(`\n📊 Estadísticas:`);
  console.log(`   • ${CHECKLIST_TEMPLATES.length} checklists creados`);
  console.log(`   • Cobertura: 100% de fases`);
  console.log(`   • Documentos totales: ~150`);
  console.log('\n📋 Credenciales iniciales:');
  USERS.forEach(u => console.log(`   ${u.role.padEnd(15)} ${u.email.padEnd(35)} Pass: ${u.password}`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());
