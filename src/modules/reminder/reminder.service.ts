import { PrismaClient } from '@prisma/client';
import { createLog } from '../atividades/atividades.service.js';
const prisma = new PrismaClient();

export async function createReminder(data: {
  title: string;
  time: string;
  type: string;
  daysOfWeek: number[];
  elderId: string;
}, userName: string, chiefId: string) { 
  const reminder = await prisma.reminder.create({
    data: {
      title: data.title,
      time: data.time,
      type: data.type,
      daysOfWeek: data.daysOfWeek,
      elderId: data.elderId,
      isCompleted: false,
    }
  });

  await createLog({
    usuario: userName,
    acao: `Adicionou o lembrete: "${data.title}"`,
    tipo: 'atividade', 
    vinculoId: chiefId 
  });

  return reminder;
}

export async function getDailyReminders(elderId: string) {
  const dataAtual = new Date();
  let hoje = dataAtual.getDay(); 
  if (hoje === 0) hoje = 7; 

  return prisma.reminder.findMany({
    where: {
      elderId: elderId,
      daysOfWeek: {
        has: hoje 
      }
    },
    orderBy: {
      time: 'asc' 
    }
  });
}

export async function markReminderAsDone(reminderId: string) {
  const reminder = await prisma.reminder.update({
    where: { id: reminderId },
    include: { elder: true }, 
    data: { 
      isCompleted: true
    }
  });

  try {
      if (reminder.elder) {
          await createLog({
              usuario: reminder.elder.name || "Idoso",
              acao: `Concluiu o lembrete: "${reminder.title}"`,
              tipo: 'idoso',
              vinculoId: reminder.elder.chiefId || reminder.elderId
          });
      }
  } catch (err) {
      console.error("Aviso: Falha ao gerar log de conclusão, mas lembrete foi salvo.", err);
  }

  return reminder;
}

export async function dailyResetReminders() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const pendentes = await prisma.reminder.findMany({
    where: { isCompleted: false }
  });

  await prisma.reminder.updateMany({
    where: {
      isCompleted: true,
    },
    data: {
      isCompleted: false
    }
  });

  console.log("Banco reciclado para o novo dia!");
}

export async function updateReminder(id: string, data: any, userName: string, chiefId: string) {
  const updated = await prisma.reminder.update({
    where: { id: id },
    data: { ...data, isCompleted: false },
  });

  await createLog({
    usuario: userName,
    acao: `Editou o lembrete: "${updated.title}"`,
    tipo: 'admin',
    vinculoId: chiefId
  });

  return updated;
}

export async function deleteReminder(id: string, userName: string, chiefId: string) {
  const deleted = await prisma.reminder.delete({
    where: { id: id },
  });

  await createLog({
    usuario: userName,
    acao: `Excluiu o lembrete: "${deleted.title}"`,
    tipo: 'admin',
    vinculoId: chiefId
  });
}