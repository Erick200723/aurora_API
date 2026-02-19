import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createEmergencyAlert(elderId: string) {
 const elder = await prisma.elder.findUnique({
  where: { id: elderId },
  select: { 
    id: true, 
    name: true, 
    chiefId: true,
    collaborators: { select: { userId: true } }
  }
});

  if (!elder) throw new Error("Idoso não encontrado");

  const alert = await prisma.emergency.create({
    data: {
      elderId: elder.id,
      chiefId: elder.chiefId, 
      resolved: false
    }
  });

  const targetIds = [
    elder.chiefId, 
    ...elder.collaborators.map(c => c.userId)
  ];

  return {
    alert,
    targetIds, // Retorne o array de IDs
    elderName: elder.name
  };
}