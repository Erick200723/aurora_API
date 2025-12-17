import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import RegisterCollaboratorInput from '../../interfaces/Collaborator.interface.js';
import { generateOTP, otpExpires } from '../../utils/otp.js';
import { sendOTPEmail } from '../../utils/mail.js';

const prisma = new PrismaClient();

export async function registerCollaborator(data: RegisterCollaboratorInput) {
  return await prisma.$transaction(async (tx) => {
    const elder = await tx.elder.findUnique({
      where: { cpf: data.elderCpf },
      include: { chief: true }
    });

    if (!elder) throw new Error('Elder not found');
    if (!elder.chief.planPaid) throw new Error('Chief plan not paid');

    const exists = await tx.user.findUnique({
      where: { email: data.email }
    });

    if (exists) throw new Error('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        role: 'FAMILIAR_COLABORADOR',
        status: 'PENDING'
      }
    });

    await tx.collaborator.create({
      data: {
        userId: user.id,
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

