import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any, 
});

export async function stripeWebhook(app: FastifyInstance) {
  app.post('/webhook', 
    {
      config: {
        rawBody: true, 
      }
    },
    async (request, reply) => {
      const signature = request.headers['stripe-signature'];

      const rawBody = (request as any).rawBody;

      if (!signature || !rawBody) {
        console.error("Erro: Assinatura ou RawBody ausente.");
        return reply.status(400).send({ error: 'Missing signature or body' });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          rawBody, 
          signature,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      } catch (err: any) {
        console.error(`❌ Webhook Signature Error: ${err.message}`);
        return reply.status(400).send({ error: `Webhook Error: ${err.message}` });
      }

      console.log(`🔔 Evento recebido: ${event.type}`);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const userId = session.metadata?.userId;
        const type = session.metadata?.type; 
        const stripeSessionId = session.id;

        console.log(`Processando pagamento para User: ${userId}, Type: ${type}, Session: ${stripeSessionId}`);

        if (userId && type) {
          try {
            const existingPayment = await prisma.payment.findUnique({
              where: { stripeSessionId: stripeSessionId }
            });

            if (existingPayment?.status === 'COMPLETED') {
              console.log('Pagamento já processado anteriormente.');
              return reply.status(200).send({ received: true });
            }

            await prisma.$transaction(async (tx) => {
               await tx.payment.upsert({
                 where: { stripeSessionId: stripeSessionId },
                 create: {
                   userId,
                   stripeSessionId,
                   amount: session.amount_total ? session.amount_total / 100 : 30,
                   status: 'COMPLETED',
                   type: type as any 
                 },
                 update: {
                   status: 'COMPLETED'
                 }
               });
               const fieldToIncrement = type === 'ELDER_EXTRA' ? 'elderCredits' : 'collaboratorCredits';
               
               await tx.user.update({
                 where: { id: userId },
                 data: {
                   [fieldToIncrement]: { increment: 1 }
                 }
               });
            });

            console.log(`✅ Sucesso: Créditos atualizados para o usuário ${userId}`);
          } catch (dbError) {
            console.error("❌ Erro ao salvar no banco:", dbError);
            return reply.status(500).send({ error: 'Database transaction failed' });
          }
        } else {
            console.error("❌ Erro: Metadata (userId ou type) faltando no evento do Stripe.");
        }
      }

      return reply.status(200).send({ received: true });
    }
  );
}