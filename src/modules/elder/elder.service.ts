import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import CreateElderInput from '../../interfaces/elder.interface.js';

const prisma = new PrismaClient();

export async function CreateElder(data: CreateElderInput) {
  // 1️⃣ Verifica CPF duplicado
  const exists = await prisma.elder.findUnique({
    where: { cpf: data.cpf }
  });

  if (exists) {
    throw new Error('Elder with this CPF already exists');
  }

  // 2️⃣ Regra de negócio: plano pago após o primeiro idoso
  const elderCount = await prisma.elder.count({
    where: { chiefId: data.chiefId }
  });

  if (elderCount >= 1) {
    const chief = await prisma.user.findUnique({
      where: { id: data.chiefId }
    });

    if (!chief?.planPaid) {
      throw {
        code: "PLAN_REQUIRED",
        message: "Plano pago é necessário para cadastrar mais de um idoso.",
        status_code: 402
      };
    }
  }

  // 3️⃣ Transaction para garantir que User e Elder sejam vinculados corretamente
  return await prisma.$transaction(async (tx) => {
    
    // Primeiro, criamos o Elder
    const elder = await tx.elder.create({
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

    // Se o Admin marcou para criar login para o idoso
    if (data.createLogin) {
      if (!data.email || !data.password) {
        throw {
          code: "MISSING_CREDENTIALS",
          message: "Email e senha são obrigatórios para criar acesso.",
          status_code: 400
        };
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      // Criamos o User já passando o ID do Elder que acabamos de criar
      await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: passwordHash,
          role: 'IDOSO',
          status: 'ACTIVE',
          elderProfileId: elder.id // AQUI ESTÁ A AMARRAÇÃO!
        }
      });
    }

    return elder;
  });
}

// ... restante das funções (verificarElderPlan e getEldersByChief permanecem similares)

export async function getEldersByChief(chiefId: string) {
  try {
    const elders = await prisma.elder.findMany({
      where: { chiefId },
      include: {
        // Incluímos também o userAccount para saber se esse idoso tem login
        userAccount: {
          select: {
            id: true,
            email: true,
            status: true
          }
        },
        collaborators: {
          include: {
            user: true
          }
        }
      }
    });
    return elders;
  } catch (error) {
    throw {
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao buscar seus idosos cadastrados",
      status_code: 500
    };
  }
}