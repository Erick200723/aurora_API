import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any,
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
      return reply.status(400).send({ error: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const type = session.metadata?.type;

      if (userId && type) {
        const payment = await prisma.payment.findUnique({
          where: { stripeSessionId: session.id }
        });

        if (payment && payment.status !== 'COMPLETED') {
          await prisma.$transaction([
            prisma.payment.update({
              where: { stripeSessionId: session.id },
              data: { status: 'COMPLETED' },
            }),
            prisma.user.update({
              where: { id: userId },
              data: {
                [type === 'ELDER_EXTRA' ? 'elderCredits' : 'collaboratorCredits']: {
                  increment: 1
                }
              }
            })
          ]);
          
          console.log(`Sucesso: Crédito de ${type} adicionado ao usuário ${userId}`);
        }
      }
    }

    return reply.status(200).send({ received: true });
  });
}