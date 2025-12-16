import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import RegisterCollaboratorInput from '../interfaces/Collaborator.interface.js';
import { generateOTP, otpExpires } from '../utils/otp.js';
import { sendOTPEmail } from '../utils/mail.js';

const prisma = new PrismaClient();

export async function registerCollaborator(data: RegisterCollaboratorInput) {
  const elder = await prisma.elder.findUnique({
    where: { cpf: data.elderCpf },
    include: { chief: true }
  });

  if (!elder) {
    throw new Error('Elder not found');
  }

  if (!elder.chief.planPaid) {
    throw new Error('Chief plan not paid');
  }

  const exists = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (exists) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: passwordHash,
      role: 'FAMILIAR_COLABORADOR',
      status: 'PENDING'
    }
  });

  const code = generateOTP();

  await prisma.verificationCode.create({
    data: {
      email: data.email,
      code,
      expiresAt: otpExpires()
    }
  });

  await sendOTPEmail(data.email, code);

  return { message: 'Verification code sent to email' };
}

export async function verifyCollaborator(email: string, code: string) {
  const record = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      used: false,
      expiresAt: { gt: new Date() }
    }
  });

  if (!record) {
    throw new Error('Invalid or expired code');
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true }
  });

  const user = await prisma.user.update({
    where: { email },
    data: { status: 'ACTIVE' }
  });

  // 🔗 criar vínculo collaborator
  const elder = await prisma.elder.findFirst({
    where: {
      chief: {
        planPaid: true
      }
    }
  });

  await prisma.collaborator.create({
    data: {
      userId: user.id,
      elderId: elder!.id,
      chiefId: elder!.chiefId
    }
  });

  return user;
}
