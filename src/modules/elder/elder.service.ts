import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import CreateElderInput from '../../interfaces/elder.interface.js';

const prisma = new PrismaClient();

export async function CreateElder(data: CreateElderInput) {

  const exists = await prisma.elder.findUnique({
    where: { cpf: data.cpf }
  });

  if (exists) {
    throw new Error('Elder with this CPF already exists');
  }

  return await prisma.$transaction(async (tx) => {
    
    const elderCount = await tx.elder.count({
      where: { chiefId: data.chiefId }
    });

    const chief = await tx.user.findUnique({
      where: { id: data.chiefId }
    });

    if (!chief) throw new Error("Responsável não encontrado");

    if (elderCount >= 1) {
      if (chief.elderCredits <= 0) {
        throw {
          code: "PLAN_REQUIRED",
          message: "Você já atingiu o limite de 1 idoso gratuito. Adquira créditos para adicionar mais.",
          status_code: 402
        };
      }
      await tx.user.update({
        where: { id: data.chiefId },
        data: { elderCredits: { decrement: 1 } }
      });
    }

    const elder = await tx.elder.create({
      data: {
        name: data.name,
        cpf: data.cpf,
        age: data.age,
        phone: data.phone,
        address: data.address,
        emergencyContact: data.emergencyContact || "",
        chiefId: data.chiefId,
        bloodType: data.bloodType,
        allergies: data.allergies ?? [],
        medicalConditions: data.medicalConditions ?? [],
        medications: data.medications ?? [],
        observations: data.observations,
        ...(data.birthData && { birthData: new Date(data.birthData) })
      }
    });

    if (data.createLogin) {
      if (!data.email || !data.password) {
        throw {
          code: "MISSING_CREDENTIALS",
          message: "Email e senha são obrigatórios para criar acesso.",
          status_code: 400
        };
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: passwordHash,
          role: 'IDOSO',
          status: 'ACTIVE',
          elderProfileId: elder.id 
        }
      });
    }

    return elder;
  });
}

export async function getEldersByChief(chiefId: string) {
  try {
    return await prisma.elder.findMany({
      where: { chiefId },
      include: {
        userAccount: { select: { id: true, email: true, status: true } },
        collaborators: { include: { user: true } }
      }
    });
  } catch (error) {
    throw { code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar idosos", status_code: 500 };
  }
}

export async function deletElder(id: string, chiefId: string) {
  try {
    const elder = await prisma.elder.findFirst({
      where: { id, chiefId },
      include: { userAccount: true } 
    });

    if (!elder) {
      throw { 
        code: "ELDER_NOT_FOUND", 
        message: "Idoso não encontrado ou você não tem permissão.", 
        status_code: 404 
      };
    }

    return await prisma.$transaction(async (tx) => {
      const accounts = elder.userAccount;

      if (Array.isArray(accounts) && accounts.length > 0) {
        await tx.user.delete({
          where: { id: (accounts[0] as any).id }
        });
      } else if (accounts && !(Array.isArray(accounts))) {
        await tx.user.delete({
          where: { id: (accounts as any).id }
        });
      }

      await tx.elder.delete({
        where: { id }
      });

      return { message: "Idoso e dados vinculados removidos com sucesso" };
    });
  } catch (error: any) {
    if (error.status_code) throw error;
    throw {
      code: "DELETE_FAILED",
      message: "Erro interno ao remover idoso",
      status_code: 500
    };
  }
}
export async function UpdateElder(id:string,chiefId:string,updateData:any){
  const elder = await prisma.elder.findFirst({
    where:{id,chiefId}
  })

  if(!elder) throw new Error("Idoso não encontrado ou sempermissão")

  return await prisma.elder.update({
    where:{id},
    data:{
      ...updateData,
      ...(updateData.birthData && { birthData: new Date(updateData.birthData) })
    }
  })
}