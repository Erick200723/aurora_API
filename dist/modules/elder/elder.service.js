import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function CreateElder(data) {
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
    let userId;
    if (data.createLogin) {
        if (!data.email || !data.password) {
            throw {
                code: "MISSING_CREDENTIALS",
                message: "Email and password are required to create login",
                status_code: 400
            };
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
export async function verificarElderPlan(chiefId) {
    const elderCount = await prisma.elder.count({
        where: { chiefId }
    });
    if (elderCount >= 1) {
        const chief = await prisma.user.findUnique({
            where: { id: chiefId }
        });
    }
    const chief = await prisma.user.findUnique({
        where: { id: chiefId }
    });
    if (!chief?.planPaid) {
        throw {
            code: "PLAN_REQUIRED",
            message: "Plan required to add more elders",
            status_code: 402
        };
    }
    //proteger a rota ate que o chief tenha um plano pago
    return true;
}
