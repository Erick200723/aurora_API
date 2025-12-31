import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import RegisterCollaboratorInput from '../../interfaces/Collaborator.interface.js';
import { generateOTP, otpExpires } from '../../utils/otp.js';
import { sendOTPEmail } from '../../utils/mail.js';

const prisma = new PrismaClient();

export async function registerCollaborator(
  data: RegisterCollaboratorInput,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    // 1 verifica email
    const exists = await tx.user.findUnique({
      where: { email: data.email }
    });

    if (exists) {
      throw{
        code: "EMAIL_ALREADY_REGISTERED",
        message: "Email ja registrado",
        status_code: 400 
      };
    }

    // 2 busca elder
    const elder = await tx.elder.findUnique({
      where: { cpf: data.elderCpf }
    });

    if (!elder) {
      throw{
        code: "ELDER_NOT_FOUND",
        message: "Elder not found",
        status_code: 404
      };
    }

    // 3 cria usuário do colaborador
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

    // 4 cria vínculo
    await tx.collaborator.create({
      data: {
        userId: collaboratorUser.id,
        elderId: elder.id,
        chiefId: elder.chiefId
      }
    });

    // 5 gera OTP
    const code = generateOTP();

    await tx.verificationCode.create({
      data: {
        email: data.email,
        code,
        expiresAt: otpExpires()
      }
    });

    // 6 envia OTP
    await sendOTPEmail(data.email, code);

    return { message: 'Verification code sent to email' };
  });
}

