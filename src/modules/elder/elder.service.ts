import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import CreateElderInput from '../../interfaces/elder.interface.js';
import RegisterCollaboratorInput from '../../interfaces/Collaborator.interface.js';

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

  const elder = await prisma.elder.create({
    data: {
        name: data.name,
        cpf: data.cpf,
        age: data.age,
        emergencyContact: data.emergencyContact,
        chiefId: data.chiefId,
        medicalConditions: data.medicalConditions ?? [],
        medications: data.medications ?? [],
        ...(data.birthData && {
        birthData: new Date(data.birthData)
        }),
        ...(userId && {
        userId
        })
    }
    });
    return elder;
}

export async function registerCollaborator(data: RegisterCollaboratorInput) {
  const elder = await prisma.elder.findUnique({
    where: { cpf: data.elderCpf },
    include: { chief: true }
  });

  if (!elder) {
    throw new Error('Elder not found');
  }

  if (!elder.chief.planPaid) {
    throw new Error('Plan not paid');
  }

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await bcrypt.hash(data.password, 10),
      role: 'FAMILIAR_COLABORADOR',
      status: 'PENDING'
    }
  });
}