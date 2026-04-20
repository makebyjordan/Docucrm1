const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Dropping dependent defaults and Enum "Phase"...');
    
    // First, remove the default from the columns that might still have it using the old Enum type
    // In PostgreSQL, defaults are tied to the type.
    await prisma.$executeRawUnsafe(`ALTER TABLE "expedients" ALTER COLUMN "currentPhase" DROP DEFAULT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "checklist_templates" ALTER COLUMN "phase" DROP DEFAULT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "documents" ALTER COLUMN "phase" DROP DEFAULT`);

    // Now drop the enum
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "Phase" CASCADE`);
    
    console.log('Success dropping Enum!');
  } catch (err) {
    console.error('Error dropping Enum:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
