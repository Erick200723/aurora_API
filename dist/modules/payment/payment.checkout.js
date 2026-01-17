import { z } from 'zod';
import { createCheckoutSession } from './payment.service.js';
import { authenticate } from '../../hooks/authenticate.js';
export default async function paymentRoutes(fastify) {
    const app = fastify.withTypeProvider();
    app.post('/checkout', {
        preHandler: authenticate,
        schema: {
            tags: ['Payments'],
            summary: 'Criar sessão de checkout Stripe',
            body: z.object({
                type: z.enum(['ELDER_EXTRA', 'COLLABORATOR'])
            }),
            response: {
                200: z.object({
                    checkoutUrl: z.string()
                })
            }
        }
    }, async (request) => {
        const { type } = request.body;
        const userId = request.user.id;
        return await createCheckoutSession(userId, type);
    });
}
