const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const exp = await prisma.expedient.findFirst({
    where: { code: 'EXP-2026-0010' }
  });
  console.log('Expedient details:', JSON.stringify(exp, null, 2));
}

check().finally(() => prisma.$disconnect());
