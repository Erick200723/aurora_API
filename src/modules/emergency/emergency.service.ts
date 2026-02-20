import { PrismaClient } from '@prisma/client';
import { StringFormatParams } from 'zod/v4/core';
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

export async function getEmergenciesForUser(userId:string,role:string){
  return await prisma.emergency.findMany({
    where: {
      OR:[{chiefId:userId},{elder:{collaborators: {some:{userId}}}}]
    },
    include: {
      elder:{select:{name:true}}
    },
    orderBy: { id: 'desc' }
  })
}

export async function resolveEmergencyAlert(alertId:string, ){
  return await prisma.emergency.update({
    where: {id:alertId},
    data:{
      resolved: true
    }
  })
}