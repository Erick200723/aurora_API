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

/**
 * CORREÇÃO 1 e 2: Retorna TODOS os lembretes do dia sem esconder os concluídos e sem limite
 */
export async function getDailyReminders(elderId: string) {
  const dataAtual = new Date();
  let hoje = dataAtual.getDay(); 
  if (hoje === 0) hoje = 7; 

  return prisma.reminder.findMany({
    where: {
      elderId: elderId,
      // REMOVIDO o isCompleted: false daqui. Agora ele manda pendentes e concluídos.
      daysOfWeek: {
        has: hoje 
      }
    },
    // REMOVIDO o take: 3 daqui. Agora a lista não tem limite!
    orderBy: {
      time: 'asc' 
    }
  });
}

/**
 * CORREÇÃO 3: Proteção contra quebra no DB e no Log
 */
export async function markReminderAsDone(reminderId: string) {
  const reminder = await prisma.reminder.update({
    where: { id: reminderId },
    include: { elder: true }, 
    data: { 
      isCompleted: true
      // REMOVIDO o lastDone. Se não estava no seu schema.prisma, era isso que bloqueava o banco!
    }
  });

  // Try/Catch no log: Se faltar alguma info no usuário, o lembrete continua sendo concluído
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