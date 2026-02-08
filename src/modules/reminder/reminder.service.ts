import {PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createReminder(data: {
  title: string;
  time: string;
  type: string;
  daysOfWeek: number[]; // Ex: [1, 3, 5] para Seg, Qua, Sex
  elderId: string;
}) {
  return prisma.reminder.create({
    data: {
      title: data.title,
      time: data.time,
      type: data.type,
      daysOfWeek: data.daysOfWeek,
      elderId: data.elderId,
      isCompleted: false,
    }
  });
}

/**
 * BUSCA OS LEMBRETES DO DIA (Máximo 3, como você pediu)
 */
export async function getDailyReminders(elderId: string) {
  // Pegar o dia da semana atual (0-6, onde 0 é Domingo)
  // Se seu front usa 1 para Segunda e 7 para Domingo:
  const dataAtual = new Date();
  let hoje = dataAtual.getDay(); 
  if (hoje === 0) hoje = 7; // Ajusta Domingo de 0 para 7 se necessário

  return prisma.reminder.findMany({
    where: {
      elderId: elderId,
      isCompleted: false,
      daysOfWeek: {
        has: hoje // Verifica se o dia de hoje está dentro do array [1,2,3...]
      }
    },
    take: 3, // Limite de 3 para não poluir a dash
    orderBy: {
      time: 'asc' // Ordenar por horário (ex: 08:00 antes de 12:00)
    }
  });
}

/**
 * MARCAR COMO CONCLUÍDO
 * Essencial para a sua lógica de "limpeza" e reciclagem
 */
export async function markReminderAsDone(reminderId: string) {
  return prisma.reminder.update({
    where: { id: reminderId },
    data: { 
      isCompleted: true,
      lastDone: new Date() 
    }
  });
}

export async function dailyResetReminders() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // 1. Notificar quem não completou (Lógica de negócio)
  const pendentes = await prisma.reminder.findMany({
    where: { isCompleted: false }
  });
  // Aqui você dispararia o e-mail via Brevo informando o chefe...

  // 2. Resetar todos para o novo dia
  // Isso limpa o status "concluído" para que eles apareçam de novo hoje
  await prisma.reminder.updateMany({
    where: {
      isCompleted: true,
      // Opcional: apenas se o lastDone for menor que hoje (ou seja, de ontem)
    },
    data: {
      isCompleted: false
    }
  });

  console.log("Banco reciclado para o novo dia!");
}

/**
 * ATUALIZAR UM LEMBRETE
 * Permite editar o título, horário ou o tipo
 */
export async function updateReminder(id: string, data: {
  title?: string;
  time?: string;
  type?: string;
  daysOfWeek?: number[];
}) {
  return prisma.reminder.update({
    where: { id: id },
    data: {
      title: data.title,
      time: data.time,
      type: data.type,
      daysOfWeek: data.daysOfWeek,
      // Ao editar, garantimos que ele volte a ficar pendente
      isCompleted: false, 
    },
  });
}

/**
 * EXCLUIR UM LEMBRETE
 */
export async function deleteReminder(id: string) {
  return prisma.reminder.delete({
    where: { id: id },
  });
}