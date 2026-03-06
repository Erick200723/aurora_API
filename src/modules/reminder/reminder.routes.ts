import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { reminder } from '../../interfaces/remiders.interfece'
import {
    createReminder,
    getDailyReminders,
    markReminderAsDone,
    updateReminder,
    deleteReminder
} from './reminder.service.js'
import { authenticate } from '../../hooks/authenticate.js';

export default async function remiderRoutes(fastify: FastifyInstance) {
    
    fastify.post("/crete_remiders", {
        preHandler: [authenticate],
        schema: { tags: ["Lembretes"], security: [{ bearerAuth: [] }] }
    }, async (req: any, reply) => {
        try {
            const chiefId = req.user.role === 'COLLABORATOR' ? req.user.chiefId : req.user.id;
            
            return await createReminder(req.body, req.user.name, chiefId);
        } catch (err: any) {
            return reply.status(400).send({ message: "Dados inválidos!" });
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

    fastify.put('/update-reminder/:id', {
        preHandler: [authenticate],
        schema: { tags: ["Lembretes"], security: [{ bearerAuth: [] }] }
    }, async (req: any, reply) => {
        const { id } = req.params;
        const updated = await updateReminder(id, req.body, req.user.name, req.user.id);
        return reply.status(200).send(updated);
    });

    fastify.delete('/delete-reminder/:id', {
        preHandler: [authenticate],
        schema: { tags: ["Lembretes"], security: [{ bearerAuth: [] }] }
    }, async (req: any, reply) => {
        const { id } = req.params;
        await deleteReminder(id, req.user.name, req.user.id);
        return reply.status(204).send(); 
    });

    fastify.patch('/complete-reminder/:id', {
        schema: { tags: ["Lembretes"] }
    }, async (req: any, reply) => {
        const { id } = req.params;
        const completed = await markReminderAsDone(id);
        return reply.status(200).send(completed);
    });
}