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

    if (exists) throw{
      code: "EMAIL_ALREADY_REGISTERED",
      message: "Email ja registrado",
      status_code: 400

    };

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

    if (!user)  throw{
      code: "INVALID_CREDENTIALS",
      message: "Invalid credentials",
      status_code: 400
    };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw{
      code: "INVALID_CREDENTIALS",
      message: "Invalid credentials",
      status_code: 400
    };

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
    throw{
      code: "INVALID_CREDENTIALS",
      message: "Invalid credentials",
      status_code: 400
    };
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
    throw{
      code: "INVALID_CODE",
      message: "Invalid verification code",
      status_code: 400
    };
  }

  if (record.expiresAt < new Date()) {
    throw{
      code: "CODE_EXPIRED",
      message: "Verification code has expired",
      status_code: 400
    };
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
    throw{
      code: "RESEND_LIMIT_EXCEEDED",
      message: "Resend limit exceeded. Please try again later.",
      status_code: 404
    };
  }
}

export async function getAllUsers(){
  try{
    const users=await prisma.user.findMany();
    return users;
  }catch(error){
    throw{
      code: "FETCH_USERS_FAILED",
      message: "Failed to fetch users",
      status_code: 500
    };
  }
}

export async function getAllElders(){
  try{
    const elders = await prisma.elder.findMany();
    return elders;
  }catch(error){
    throw {
      code: "FETCH_ELDERS_FAILED",
      message: "Failed to fetch elders",
      status_code: 500
    };
  }
}

export async function putNameUser(id:string, name:string){
  try{
    //verificar se o usuario existe e se estar logado
    const user = await prisma.user.findUnique({
      where: {id}
    });
    if(!user){
      throw{
        code: "USER_NOT_FOUND",
        message: "User not found",
        status_code: 404
      };
    }
    const log = await loginUser(user.email, user.password);
    if(!log){
      throw{
        code: "LOGIN_FAILED",
        message: "User login failed",
        status_code: 500
      };
    }else{
      console.log('User logged in successfully');
    }
    const updatedUser = await prisma.user.update({
      where: {id},
      data: {name}
    });
    return updatedUser;
  }catch(error){
    throw {
      code: "UPDATE_FAILED",
      message: "Failed to update user name",
      status_code: 500
    }
    }
  }