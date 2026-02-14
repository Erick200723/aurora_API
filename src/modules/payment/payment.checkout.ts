import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { createCheckoutSession, PaymentType } from './payment.service.js';
import { authenticate } from '../../hooks/authenticate.js';

export default async function paymentRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    '/checkout',
      {
        preHandler: authenticate,
        schema: {
          tags: ['Payments'],
          summary: 'Comprar créditos (Idoso ou Colaborador)',
          body: z.object({
            type: z.enum(['ELDER_EXTRA', 'COLLABORATOR'])
          }),
          response: {
            200: z.object({
              checkoutUrl: z.string()
            }),
            500: z.object({
              message: z.string()
            })
          }
        }
      },
      async (request,reply) => {
        const { type } = request.body as { type: PaymentType };
        const userId = (request.user as { id: string }).id;

        const result = await createCheckoutSession(userId, type);

        if(!result.checkoutUrl){
          return reply.status(500).send({
            message: "Não foi possivel gerar URL de Pagamento."
          });
        }

        return {checkoutUrl: result.checkoutUrl}
      }
  );
}