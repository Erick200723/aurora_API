import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function stripeWebhook(app: FastifyInstance) {
  app.post('/webhook', async (request, reply) => {
    const signature = request.headers['stripe-signature'];

    if (!signature) {
      return reply.status(400).send({ error: 'Missing signature' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body as Buffer,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return reply.status(400).send({
        error: `Webhook Error: ${err.message}`,
      });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const userId = session.metadata?.userId;
        const type = session.metadata?.type; 

        if (userId && type) {
          await prisma.payment.update({
            where: { stripeSessionId: session.id },
            data: { status: 'COMPLETED' },
          });

          if (type === 'ELDER_EXTRA') {
            await prisma.user.update({
              where: { id: userId },
              data: { elderCredits: { increment: 1 } },
            });
            console.log(`Crédito de IDOSO adicionado para user ${userId}`);
          } 
          else if (type === 'COLLABORATOR') {
            await prisma.user.update({
              where: { id: userId },
              data: { collaboratorCredits: { increment: 1 } },
            });
            console.log(`Crédito de COLABORADOR adicionado para user ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`Evento ignorado: ${event.type}`);
    }

    return reply.status(200).send({ received: true });
  });
}