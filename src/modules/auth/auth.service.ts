import {Prisma,PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateOTP, otpExpires } from '../../utils/otp.js';
import { sendOTPEmail } from '../../utils/mail.js';

const prisma = new PrismaClient();

const RESEND_LIMIT = 3
const RESEND_WINDOW_MINUTES = 10

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
      used: false
    }
  });

  if (!record) {
    throw new Error('INVALID_CODE');
  }

  if (record.expiresAt < new Date()) {
    throw new Error('CODE_EXPIRED');
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true }
  });

  const user = await prisma.user.update({
    where: { email },
    data: { status: 'ACTIVE' }
  });

  return user;
}

export async function resendOTP(email: string, ip: string) {
  return prisma.$transaction(async (tx) => {
    await checkResendLimit(tx, email, ip);

    // registra tentativa
    await tx.oTPResendLog.create({
      data: { email, ip }
    });

    // invalida OTPs antigos
    await tx.verificationCode.updateMany({
      where: { email, used: false },
      data: { used: true }
    });

    // gera novo OTP
    const code = generateOTP();

    await tx.verificationCode.create({
      data: {
        email,
        code,
        expiresAt: otpExpires()
      }
    });

    await sendOTPEmail(email, code);

    return { message: 'Verification code resent' };
  });
}


async function checkResendLimit(
  tx: Prisma.TransactionClient,
  email: string,
  ip: string
) {
  const windowStart = new Date(
    Date.now() - RESEND_WINDOW_MINUTES * 60 * 1000
  );

  const attempts = await tx.oTPResendLog.count({
    where: {
      email,
      ip,
      sentAt: {
        gte: windowStart
      }
    }
  });

  if (attempts >= RESEND_LIMIT) {
    throw new Error('RESEND_LIMIT_EXCEEDED');
  }
}

export async function getAllUsers(){
  try{
    const users=await prisma.user.findMany();
    return users;
  }catch(error){
    throw new Error('Error fetching users');
  }
}

export async function getAllElders(){
  try{
    const elders = await prisma.elder.findMany();
    return elders;
  }catch(error){
    throw new Error('Error fetching elders');
  }
}