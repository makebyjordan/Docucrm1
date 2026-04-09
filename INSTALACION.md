# Guía de instalación rápida

## Requisitos previos

- Node.js 18+
- Docker y Docker Compose (para PostgreSQL)
- Git

## 1. Clonar y configurar variables de entorno

```bash
# Copiar variables de entorno del backend
cp .env.example backend/.env

# Editar backend/.env con tu configuración
# (SMTP, Google Drive, etc.)
```

## 2. Levantar la base de datos

```bash
docker-compose up -d
# Espera ~5 segundos a que Postgres arranque
```

## 3. Instalar y configurar el backend

```bash
cd backend
npm install

# Generar cliente Prisma y crear tablas
npm run db:generate
npm run db:push

# Cargar datos iniciales (usuarios, checklists, plantillas de email)
npm run db:seed
```

## 4. Instalar y arrancar el frontend

```bash
cd ../frontend
npm install
npm run dev
# Disponible en http://localhost:5173
```

## 5. Arrancar el backend

```bash
cd ../backend
npm run dev
# API disponible en http://localhost:4000
```

## 6. Acceder al CRM

Abre `http://localhost:5173` en tu navegador.

**Credenciales iniciales** (cambiar tras el primer acceso):

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@agencia.com | Admin1234! | ADMINISTRACION |
| Dirección | direccion@agencia.com | Admin1234! | DIRECCION |
| Comercial 1 | comercial1@agencia.com | Admin1234! | COMERCIAL |
| Firmas | firmas@agencia.com | Admin1234! | FIRMAS |
| Marketing | marketing@agencia.com | Admin1234! | MARKETING |

---

## Configuración de Google Drive (opcional)

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilita la API de Google Drive
3. Crea credenciales OAuth2
4. Obtén el `GOOGLE_REFRESH_TOKEN` usando el playground de OAuth
5. Crea una carpeta raíz en Drive y copia su ID desde la URL
6. Rellena las variables en `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REFRESH_TOKEN=...
   GOOGLE_DRIVE_ROOT_FOLDER_ID=...
   ```

## Configuración de email (SMTP)

Para Gmail, activa la verificación en 2 pasos y genera una "Contraseña de aplicación":

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tuagencia@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # contraseña de aplicación
```

## Producción

Para despliegue en producción:

1. Configura `NODE_ENV=production` en el backend
2. Ejecuta `npm run build` en el frontend
3. Sirve la carpeta `dist/` con Nginx o similar
4. Usa un proceso manager (PM2) para el backend
5. Configura HTTPS con Let's Encrypt

---

## Estructura del proyecto

```
crm documental/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Esquema de base de datos
│   │   └── seed.js            # Datos iniciales
│   ├── src/
│   │   ├── controllers/       # Lógica de los endpoints REST
│   │   ├── routes/            # Definición de rutas Express
│   │   ├── services/          # Servicios de negocio
│   │   │   ├── workflow.service.js      # Máquina de estados del flujo
│   │   │   ├── notification.engine.js  # Motor de notificaciones
│   │   │   ├── checklist.generator.js  # Generador de checklists
│   │   │   ├── email.service.js        # Envío de emails SMTP
│   │   │   └── drive.service.js        # Integración Google Drive
│   │   ├── jobs/
│   │   │   └── postventa.scheduler.js  # Cron de emails postventa
│   │   ├── middleware/        # Auth JWT, uploads, validación
│   │   └── config/            # Logger, configuración
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/             # Dashboard, Expedientes, Clientes, etc.
│       ├── components/        # Kanban, Checklist, Documentos, etc.
│       ├── api/               # Cliente HTTP (axios)
│       └── store/             # Estado global (zustand)
├── docker-compose.yml
├── .env.example
├── MANUAL_USUARIO.md
└── INSTALACION.md
```
