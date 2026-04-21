const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Applying migration for ExpedientLink, ClientJourney, and new Expedient columns...')

  await prisma.$executeRawUnsafe(`
    ALTER TABLE expedients
      ADD COLUMN IF NOT EXISTS "linkedOperationType" TEXT,
      ADD COLUMN IF NOT EXISTS "dependencyStatus" TEXT,
      ADD COLUMN IF NOT EXISTS "advanceConditions" JSONB
  `)
  console.log('✓ expedients columns added')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS expedient_links (
      id TEXT NOT NULL PRIMARY KEY,
      "expedientId" TEXT NOT NULL,
      "linkedExpedientId" TEXT NOT NULL,
      "linkType" TEXT NOT NULL,
      "linkDirection" TEXT NOT NULL DEFAULT 'UNIDIRECCIONAL',
      condition TEXT,
      "isBlocking" BOOLEAN NOT NULL DEFAULT false,
      "requiredPhase" TEXT,
      notes TEXT,
      "createdBy" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "expedient_links_expedientId_fkey" FOREIGN KEY ("expedientId") REFERENCES expedients(id) ON DELETE CASCADE,
      CONSTRAINT "expedient_links_linkedExpedientId_fkey" FOREIGN KEY ("linkedExpedientId") REFERENCES expedients(id) ON DELETE CASCADE,
      CONSTRAINT "expedient_links_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES users(id),
      CONSTRAINT "expedient_links_expedientId_linkedExpedientId_key" UNIQUE ("expedientId", "linkedExpedientId")
    )
  `)
  console.log('✓ expedient_links table created')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS client_journeys (
      id TEXT NOT NULL PRIMARY KEY,
      "clientId" TEXT NOT NULL UNIQUE,
      expedients JSONB NOT NULL DEFAULT '[]',
      "totalValue" DECIMAL(15,2),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "client_journeys_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE CASCADE
    )
  `)
  console.log('✓ client_journeys table created')

  console.log('Migration complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
