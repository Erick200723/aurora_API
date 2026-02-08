import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import RegisterCollaboratorInput from '../../interfaces/Collaborator.interface.js';
import { generateOTP, otpExpires } from '../../utils/otp.js';
import { sendOTPEmail } from '../../utils/mail.js';

const prisma = new PrismaClient();

export async function registerCollaborator(data:any) {
  return prisma.$transaction(async (tx) => {
    // 1. Verifica se o email do familiar já existe
    const exists = await tx.user.findUnique({
      where: { email: data.email }
    });

    if (exists) {
      throw { code: "EMAIL_ALREADY_REGISTERED", message: "Email ja registrado", status_code: 400 };
    }

    // 2. Busca o Idoso pelo CPF e inclui os dados do Usuário (Chief) vinculado a ele
    const elder = await tx.elder.findUnique({
      where: { cpf: data.elderCpf },
      include: {
        chief: true  
      }
    });

    if (!elder) {
      throw { code: "ELDER_NOT_FOUND", message: "Idoso não encontrado com este CPF", status_code: 404 };
    }

    if (!elder.chief || elder.chief.planPaid !== true) {
      throw {
        code: "PLAN_NOT_PAID",
        message: "O responsável por este idoso não possui um plano ativo. Cadastro não permitido.",
        status_code: 403
      };
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

export async function getAllCollaborators(){
  try {
    const collaborators = await prisma.collaborator.findMany();
    return collaborators;
  }catch (error){
    throw {
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not retrieve collaborators",
      status_code: 500
    };
  }
}