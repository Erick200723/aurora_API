import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import CreateElderInput from '../../interfaces/elder.interface.js';

const prisma = new PrismaClient();

export async function CreateElder(data: CreateElderInput) {
  // 1️⃣ verifica CPF duplicado
  const exists = await prisma.elder.findUnique({
    where: { cpf: data.cpf }
  });

  if (exists) {
    throw new Error('Elder with this CPF already exists');
  }

  // 2️⃣ conta elders do chief
  const elderCount = await prisma.elder.count({
    where: { chiefId: data.chiefId }
  });

  // 3️⃣ se já tem 1 ou mais → exige plano
  if (elderCount >= 1) {
    const chief = await prisma.user.findUnique({
      where: { id: data.chiefId }
    });

    if (!chief?.planPaid) {
      throw new Error('PLAN_REQUIRED');
    }
  }

  // 4️⃣ cria login do idoso (se necessário)
  let userId: string | undefined;

  if (data.createLogin) {
    if (!data.email || !data.password) {
      throw new Error('Email and password are required');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        role: 'IDOSO',
        status: 'ACTIVE'
      }
    });

    userId = user.id;
  }

  // 5️⃣ cria o elder
  const elder = await prisma.elder.create({
    data: {
      name: data.name,
      cpf: data.cpf,
      age: data.age,
      emergencyContact: data.emergencyContact,
      chiefId: data.chiefId,
      medicalConditions: data.medicalConditions ?? [],
      medications: data.medications ?? [],
      ...(data.birthData && !isNaN(Date.parse(data.birthData)) && {
        birthData: new Date(data.birthData)
      })
    }
  });

  return elder;
}
