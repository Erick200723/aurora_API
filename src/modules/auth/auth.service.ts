import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateOTP, otpExpires } from '../../utils/otp.js';
import { sendOTPEmail } from '../../utils/mail.js';

const prisma = new PrismaClient();

/**
 * REGISTRO DE FAMILIAR (COM OTP)
 */
export async function registerFamiliar(data: {
  name: string;
  email: string;
  password: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const exists = await tx.user.findUnique({
      where: { email: data.email }
    });

    if (exists) throw new Error('Email already registered');

    const hash = await bcrypt.hash(data.password, 10);

    await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
        role: 'FAMILIAR',
        status: 'PENDING'
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


/**
 * LOGIN COM SENHA (ENVIA OTP)
 */
export async function loginUser(email: string, password: string) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { email }
    });

    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const code = generateOTP();

    await tx.verificationCode.create({
      data: {
        email,
        code,
        expiresAt: otpExpires()
      }
    });

    await sendOTPEmail(email, code);

    return { message: 'Verification code sent' };
  });
}

/**
 * LOGIN DO IDOSO (SEM SENHA)
 */
export async function loginElder(email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || user.role !== 'IDOSO') {
    throw new Error('Elder not found');
  }

  const code = generateOTP();

  await prisma.verificationCode.create({
    data: {
      email,
      code,
      expiresAt: otpExpires()
    }
  });

  await sendOTPEmail(email, code);

  return { message: 'Verification code sent' };
}

/**
 * VERIFICAÇÃO DO OTP
 */
export async function verifyCode(email: string, code: string) {
  const record = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      used: false,
      expiresAt: { gt: new Date() }
    }
  });

  if (!record) throw new Error('Invalid or expired code');

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true }
  });

  const user = await prisma.user.update({
    where: { email },
    data: { status: 'ACTIVE' }
  });

  // 🔗 REGRA ESPECIAL PARA COLLABORATOR
  if (user.role === 'FAMILIAR_COLABORADOR') {
    const collaboratorExists = await prisma.collaborator.findFirst({
      where: { userId: user.id }
    });

    if (!collaboratorExists) {
      throw new Error('Collaborator not linked to any elder');
    }
  }

  return user;
}


