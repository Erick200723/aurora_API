import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { reminder } from '../../interfaces/remiders.interfece'
import {
    createReminder,
    getDailyReminders,
    markReminderAsDone,
    updateReminder,
    deleteReminder
} from './reminder.service.js'

export default async function remiderRoutes(fastify: FastifyInstance) {
    
    // Criar Lembrete
    fastify.post("/crete_remiders", {
        schema: { tags: ["Lembretes"] }
    }, async (req: FastifyRequest<{ Body: reminder }>, reply) => {
        try {
            return await createReminder(req.body)
        } catch (err: any) {
            return reply.status(400).send({ message: "Dados para lembrete inválidos!" });
        }
    })

    // Buscar Lembretes Diários
    fastify.get('/getDaliy-reminders', {
        schema: { tags: ["Lembretes"] }
    }, async (req: FastifyRequest<{ Querystring: { elderId: string } }>, reply) => {
        try {
            const { elderId } = req.query
            if (!elderId) return reply.status(400).send({ message: "elderId é obrigatório" })

            return await getDailyReminders(elderId);
        } catch (err: any) {
            return reply.status(500).send({ message: "Erro ao buscar Lembrete" })
        }
    })

    // Rota para Atualizar Lembrete (Corrigido .json() para .send() e tipagem do Body)
    fastify.put('/update-reminder/:id', {
        schema: { tags: ["Lembretes"] }
    }, async (req: FastifyRequest<{ 
        Params: { id: string }, 
        Body: Partial<reminder> // Aqui tipamos o corpo para o TS aceitar no service
    }>, reply) => {
        try {
            const { id } = req.params;
            const updated = await updateReminder(id, req.body);
            return reply.status(200).send(updated);
        } catch (error) {
            return reply.status(500).send({ error: "Erro ao atualizar lembrete" });
        }
    });

    // Rota para Deletar Lembrete (Corrigido .json() para .send())
    fastify.delete('/delete-reminder/:id', {
        schema: { tags: ["Lembretes"] }
    }, async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
        try {
            const { id } = req.params;
            await deleteReminder(id);
            return reply.status(204).send(); 
        } catch (error) {
            return reply.status(500).send({ error: "Erro ao excluir lembrete" });
        }
    });

    // Rota para Concluir Lembrete (Removida a duplicada e corrigido .send())
    fastify.patch('/complete-reminder/:id', {
        schema: { tags: ["Lembretes"] }
    }, async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
        try {
            const { id } = req.params;
            const completed = await markReminderAsDone(id);
            return reply.status(200).send(completed);
        } catch (error) {
            return reply.status(500).send({ error: "Erro ao concluir lembrete" });
        }
    });
}