const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Altering columns to text...');
    
    // ChecklistTemplate
    await prisma.$executeRawUnsafe(`ALTER TABLE "checklist_templates" ALTER COLUMN "phase" TYPE TEXT USING "phase"::text`);
    
    // ChecklistInstance
    await prisma.$executeRawUnsafe(`ALTER TABLE "checklist_instances" ALTER COLUMN "phase" TYPE TEXT USING "phase"::text`);
    
    // Document
    await prisma.$executeRawUnsafe(`ALTER TABLE "documents" ALTER COLUMN "phase" TYPE TEXT USING "phase"::text`);
    
    // PhaseHistory
    await prisma.$executeRawUnsafe(`ALTER TABLE "phase_history" ALTER COLUMN "fromPhase" TYPE TEXT USING "fromPhase"::text`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "phase_history" ALTER COLUMN "toPhase" TYPE TEXT USING "toPhase"::text`);
    
    // Expedient
    await prisma.$executeRawUnsafe(`ALTER TABLE "expedients" ALTER COLUMN "currentPhase" TYPE TEXT USING "currentPhase"::text`);

    console.log('Dropping enum type if it exists...');
    // We might not need to drop it yet, but it's cleaner.
    // However, PostgreSQL might still have it.
    
    console.log('Success!');
  } catch (err) {
    console.error('Error altering columns:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
