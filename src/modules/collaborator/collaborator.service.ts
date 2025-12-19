import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import RegisterCollaboratorInput from '../../interfaces/Collaborator.interface.js';
import { generateOTP, otpExpires } from '../../utils/otp.js';
import { sendOTPEmail } from '../../utils/mail.js';

const prisma = new PrismaClient();

export async function registerCollaborator(data:RegisterCollaboratorInput ) {
  return prisma.$transaction(async (tx) => {
    // 1️⃣ verifica email
    const exists = await tx.user.findUnique({
      where: { email: data.email }
    });

    if (exists) {
      throw new Error('EMAIL_ALREADY_REGISTERED');
    }

    // 2️⃣ busca elder
    const elder = await tx.elder.findUnique({
      where: { cpf: data.elderCpf }
    });

    if (!elder) {
      throw new Error('ELDER_NOT_FOUND');
    }

    // 3️⃣ verifica plano do chief (OBRIGATÓRIO)
    const chief = await tx.user.findUnique({
      where: { id: elder.chiefId }
    });

    if (!chief?.planPaid) {
      throw new Error('PLAN_REQUIRED');
    }

    // 4️⃣ cria usuário do colaborador
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

    // 5️⃣ cria vínculo
    await tx.collaborator.create({
      data: {
        userId: collaboratorUser.id,
        elderId: elder.id,
        chiefId: elder.chiefId
      }
    });

    // 6️⃣ gera OTP
    const code = generateOTP();

    await tx.verificationCode.create({
      data: {
        email: data.email,
        code,
        expiresAt: otpExpires()
      }
    });

    // 7️⃣ envia OTP
    await sendOTPEmail(data.email, code);

    return { message: 'Verification code sent to email' };
  });
}

