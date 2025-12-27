import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {createCheckoutSession}  from './payment.service.js';

export default async function paymentRoutes(
  fastify: FastifyInstance
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    '/checkout',
    {
      schema: {
        body: z.object({
          type: z.enum(['ELDER_EXTRA', 'COLLABORATOR'])
        })
      },
      preHandler: [fastify.authenticate] // JWT
    },
    async (request) => {
      const { type } = request.body;
      const userId = request.user.id;

      return createCheckoutSession(userId, type);
    }
  );
}
