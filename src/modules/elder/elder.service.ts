import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import CreateElderInput from '../../interfaces/elder.interface.js';

const prisma = new PrismaClient();

export async function CreateElder(data: CreateElderInput) {
  let userId: string | undefined = undefined;

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
  const exists= await prisma.elder.findUnique({
      where: {cpf: data.cpf}
    });

    if (exists) {
      throw new Error('Elder with this CPF already exists');
    }

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
