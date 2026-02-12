import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createEmergencyAlert(elderId: string) {
  const elder = await prisma.elder.findUnique({
    where: { id: elderId },
    select: { id: true, name: true, chiefId: true }
  });

  if (!elder) throw new Error("Idoso não encontrado");

  const alert = await prisma.emergency.create({
    data: {
      elderId: elder.id,
      chiefId: elder.chiefId, // Agora o campo está certo no schema
      resolved: false
    }
  });

  return {
    alert,
    chiefId: elder.chiefId,
    elderName: elder.name
  };
}