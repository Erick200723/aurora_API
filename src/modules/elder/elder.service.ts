import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import CreateElderInput from '../../interfaces/elder.interface.js';

const prisma = new PrismaClient();

export async function CreateElder(data: CreateElderInput) {
  // 1️⃣ Verifica CPF duplicado
  const exists = await prisma.elder.findUnique({
    where: { cpf: data.cpf }
  });

  if (exists) {
    throw new Error('Elder with this CPF already exists');
  }

  // 2️⃣ Início da Transaction para controle de créditos
  return await prisma.$transaction(async (tx) => {
    
    // Busca o chefe e a contagem de idosos atuais
    const elderCount = await tx.elder.count({
      where: { chiefId: data.chiefId }
    });

    const chief = await tx.user.findUnique({
      where: { id: data.chiefId }
    });

    if (!chief) throw new Error("Responsável não encontrado");

    // LÓGICA DE CRÉDITOS: Se já tem 1 idoso, precisa de crédito para o próximo
    if (elderCount >= 1) {
      if (chief.elderCredits <= 0) {
        throw {
          code: "PLAN_REQUIRED",
          message: "Você já atingiu o limite de 1 idoso gratuito. Adquira créditos para adicionar mais.",
          status_code: 402
        };
      }

      // Consome 1 crédito
      await tx.user.update({
        where: { id: data.chiefId },
        data: { elderCredits: { decrement: 1 } }
      });
    }

    // 3️⃣ Criamos o Elder
    const elder = await tx.elder.create({
      data: {
        name: data.name,
        cpf: data.cpf,
        age: data.age,
        emergencyContact: data.emergencyContact,
        chiefId: data.chiefId,
        medicalConditions: data.medicalConditions ?? [],
        medications: data.medications ?? [],
        ...(data.birthData && !isNaN(Date.parse(data.birthData)) && {
          birthData: new Date(data.birthData)
        })
      }
    });

    // 4️⃣ Criação de login para o idoso (se solicitado)
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

// getEldersByChief permanece igual, mudando apenas para usar o prisma global se não estiver em transaction
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