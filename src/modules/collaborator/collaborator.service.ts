import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateOTP, otpExpires } from '../../utils/otp.js';
import { sendOTPEmail } from '../../utils/mail.js';

const prisma = new PrismaClient();

// 1. Sua função de registro, agora com a lógica de créditos "indestrutível"
export async function registerCollaborator(data: any) {
  return prisma.$transaction(async (tx) => {
    const exists = await tx.user.findUnique({
      where: { email: data.email }
    });

    if (exists) {
      throw { code: "EMAIL_ALREADY_REGISTERED", message: "Email já registrado", status_code: 400 };
    }

    const elder = await tx.elder.findUnique({
      where: { cpf: data.elderCpf },
      include: { chief: true }
    });

    if (!elder || !elder.chief) {
      throw { code: "ELDER_NOT_FOUND", message: "Idoso ou responsável não encontrado", status_code: 404 };
    }

    // --- LÓGICA DE CRÉDITOS ---
    const collaboratorCount = await tx.collaborator.count({
      where: { chiefId: elder.chiefId }
    });

    // Se já tem 1 colaborador, precisa gastar crédito
    if (collaboratorCount >= 1) {
      if (elder.chief.collaboratorCredits <= 0) {
        throw {
          code: "PLAN_REQUIRED",
          message: "Limite de 1 colaborador gratuito atingido. Adquira créditos.",
          status_code: 402
        };
      }

      await tx.user.update({
        where: { id: elder.chiefId },
        data: { collaboratorCredits: { decrement: 1 } }
      });
    }

    const hash = await bcrypt.hash(data.password, 10);
    const collaboratorUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
        role: 'COLLABORATOR',
        status: 'PENDING'
      }
    });

    await tx.collaborator.create({
      data: {
        userId: collaboratorUser.id,
        elderId: elder.id,
        chiefId: elder.chiefId
      }
    });
    
    const code = generateOTP();
    await tx.verificationCode.create({
      data: {
        email: data.email,
        code,
        expiresAt: otpExpires()
      }
    });

    await sendOTPEmail(data.email, code);
    return { message: 'Verification code sent to email' };
  });
}

export async function getCollaboratorsByChief(chiefId: string) {
  try {
    const collaborators = await prisma.collaborator.findMany({
      where: { chiefId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          }
        },
        elder: {
          select: {
            name: true
          }
        }
      }
    });
    return collaborators;
  } catch (error) {
    throw {
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao buscar colaboradores vinculados ao seu perfil",
      status_code: 500
    };
  }
}

// 3. Sua função de listagem geral (Recuperada!)
export async function getAllCollaborators() {
  try {
    const collaborators = await prisma.collaborator.findMany();
    return collaborators;
  } catch (error) {
    throw {
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not retrieve collaborators",
      status_code: 500
    };
  }
}

export async function deletCollaborator(id: string, chiefId: string) {
  try {
    // 1. Localiza o colaborador garantindo que ele pertence ao Chief logado
    const collab = await prisma.collaborator.findFirst({
      where: { 
        id: id,
        chiefId: chiefId 
      }
    });

    if (!collab) {
      throw { 
        code: "COLLABORATOR_NOT_FOUND", 
        message: "Colaborador não encontrado ou você não tem permissão para removê-lo.", 
        status_code: 404 
      };
    }
    return await prisma.$transaction(async (tx) => {
      await tx.collaborator.delete({ where: { id } });
      
      await tx.user.delete({ where: { id: collab.userId } });

      return { message: "Colaborador removido com sucesso" };
    });
  } catch (error: any) {
    if (error.status_code) throw error;
    throw {
      code: "DELETE_FAILED",
      message: "Erro interno ao remover colaborador",
      status_code: 500
    };
  }
}