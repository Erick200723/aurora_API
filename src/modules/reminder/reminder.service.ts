import {PrismaClient } from '@prisma/client';
import { createLog } from '../atividades/atividades.service.js';
const prisma = new PrismaClient();

export async function createReminder(data: {
  title: string;
  time: string;
  type: string;
  daysOfWeek: number[];
  elderId: string;
}, userName: string, chiefId: string) { // Adicionamos quem criou e o ID do Admin
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
    acao: `Criou o lembrete: "${data.title}" para as ${data.time}`,
    tipo: 'admin',
    vinculoId: chiefId
  });

  return reminder;
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
  const reminder = await prisma.reminder.update({
    where: { id: reminderId },
    include: { elder: true }, 
    data: { 
      isCompleted: true,
      lastDone: new Date() 
    }
  });

  await createLog({
      usuario: reminder.elder.name,
      acao: `Concluiu o lembrete: "${reminder.title}"`,
      tipo: 'idoso',
      vinculoId: reminder.elder.chiefId
    });

    return reminder;
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

/**
 * EXCLUIR UM LEMBRETE
 */
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