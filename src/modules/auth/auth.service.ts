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
  return prisma.$transaction(async (tx) => {
    const exists = await tx.user.findUnique({ where: { email: data.email } });
    if (exists) throw new Error("EMAIL_ALREADY_REGISTERED");

    const hash = await bcrypt.hash(data.password, 10);

    await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
        role: "FAMILIAR",
        status: "PENDING"
      }
    });

    const code = generateOTP();

    await tx.verificationCode.create({
      data: { email: data.email, code, expiresAt: otpExpires() }
    });

    await sendOTPEmail(data.email, code);

    return { message: "Verification code sent" };
  });
}


/**
 * LOGIN COM SENHA (ENVIA OTP)
 */
export async function loginUser(email: string, password: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email } });
    if (!user) throw new Error("INVALID_CREDENTIALS");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("INVALID_CREDENTIALS");

    const code = generateOTP();

    await tx.verificationCode.create({
      data: { email, code, expiresAt: otpExpires() }
    });

    await sendOTPEmail(email, code);

    return {
      message: "Verification code sent",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    };
  });
}

/**
 * LOGIN DO IDOSO (SEM SENHA)
 */
export async function loginElder(email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || user.role !== "IDOSO") {
    throw {
      code: "INVALID_CREDENTIALS",
      message: "Invalid credentials",
      status_code: 400
    };
  }

  // 🔥 Remove qualquer OTP antigo ainda não usado
  await prisma.verificationCode.deleteMany({
    where: {
      email,
      used: false
    }
  });

  const code = generateOTP();
  const expiresAt = otpExpires();

  await prisma.verificationCode.create({
    data: {
      email,
      code,
      expiresAt,
      used: false
    }
  });

  await sendOTPEmail(email, code);

  return {
    message: "Verification code sent"
  };
}


/**
 * VERIFICAÇÃO DO OTP
 */
export async function verifyCode(email: string, code: string,) {
  const record = await prisma.verificationCode.findFirst({
    where: { email, code, used: false },
    orderBy: { createdAt: "desc" }
  });

  if (!record) throw new Error("INVALID_CODE");

  if (record.expiresAt.getTime() <= Date.now()) {
    throw new Error("CODE_EXPIRED");
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true }
  });

  return prisma.user.update({
    where: { email },
    data: { status: "ACTIVE" }
  });
}



export async function resendOTP(email: string, ip: string) {
  return prisma.$transaction(async (tx) => {
    await checkResendLimit(tx, email, ip);

    await tx.oTPResendLog.create({ data: { email, ip } });

    await tx.verificationCode.updateMany({
      where: { email, used: false },
      data: { used: true }
    });

    const code = generateOTP();

    await tx.verificationCode.create({
      data: { email, code, expiresAt: otpExpires() }
    });

    await sendOTPEmail(email, code);

    return { message: "Verification code resent" };
  });
}


async function checkResendLimit(
  tx: Prisma.TransactionClient,
  email: string,
  ip: string
) {
  const windowStart = new Date(Date.now() - 10 * 60 * 1000);

  const attempts = await tx.oTPResendLog.count({
    where: { email, ip, sentAt: { gte: windowStart } }
  });

  if (attempts >= 3) {
    throw new Error("RESEND_LIMIT_EXCEEDED");
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