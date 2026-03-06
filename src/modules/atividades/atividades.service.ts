import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createLog(data:any) {
  return await prisma.activity.create({
    data: {
      usuario: data.usuario,
      acao: data.acao,
      tipo: data.tipo,
      vinculoId: data.vinculoId
    }
  });
}

export async function getLogsByChief(chiefId:string) {
  return await prisma.activity.findMany({
    where: { vinculoId: chiefId },
    orderBy: { timestamp: 'desc' },
    take: 50 // Retorna as últimas 50
  });
}