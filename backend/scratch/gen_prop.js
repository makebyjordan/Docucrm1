const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const checklistGenerator = require('../src/services/checklist.generator');

async function testGeneration() {
  const expedientId = 'cmo5xj4pk003t2v64vh021a3v'; // EXP-2026-0009
  const exp = await prisma.expedient.findUnique({ where: { id: expedientId } });
  
  console.log('Generating for PROPIETARIO phase:', exp.currentPhase);
  
  try {
    const instances = await checklistGenerator.generateForPhase(
      expedientId, exp.currentPhase, exp.operationType, exp.operationSize
    );
    console.log('Generated instances:', JSON.stringify(instances, null, 2));
  } catch (err) {
    console.error('Error generating:', err);
  }
}

testGeneration().finally(() => prisma.$disconnect());
