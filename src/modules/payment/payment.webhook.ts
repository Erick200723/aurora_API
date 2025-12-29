import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function stripeWebhook(app: FastifyInstance) {
  app.post('/webhook/stripe', async (request, reply) => {
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
      return reply.status(400).send({
        error: `Webhook Error: ${err.message}`,
      });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const type = session.metadata?.type;

      if (!userId || !type) {
        return reply.status(400).send({ error: 'Missing metadata' });
      }

      await prisma.payment.create({
        data: {
          userId,
          type,
          amount: session.amount_total!,
          stripeSessionId: session.id,
        },
      });

      // libera plano
      if (type === 'COLLABORATOR') {
        await prisma.user.update({
          where: { id: userId },
          data: { planPaid: true },
        });
      }
    }

    return reply.send({ received: true });
  });
}
