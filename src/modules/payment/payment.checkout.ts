import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { createCheckoutSession } from './payment.service.js';
import { authenticate } from '../../hooks/authenticate.js';

export default async function paymentRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    '/checkout',
      {
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
      },
      async (request) => {
        const { type } = request.body;
        const userId = (request.user as { id: string }).id;

        return await createCheckoutSession(userId, type);
      }
  );

}
