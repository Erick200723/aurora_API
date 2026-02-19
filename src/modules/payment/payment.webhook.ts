import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// REMOVIDO: apiVersion '.clover' (Isso pode causar erro se a lib não suportar)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any, // Use a versão mais recente estável ou remova essa linha
});

export async function stripeWebhook(app: FastifyInstance) {
  app.post('/webhook', 
    {
      config: {
        rawBody: true, // Garante que o plugin fastify-raw-body atue aqui
      }
    },
    async (request, reply) => {
      const signature = request.headers['stripe-signature'];
      const rawBody = (request as any).rawBody;

      // --- LOGS DE DIAGNÓSTICO (Olhe isso no Render) ---
      console.log(`🔍 [Webhook Start] Recebendo requisição...`);
      console.log(`- Signature Header: ${signature ? 'Presente' : 'AUSENTE ❌'}`);
      console.log(`- RawBody Type: ${typeof rawBody}`);
      console.log(`- RawBody IsBuffer: ${Buffer.isBuffer(rawBody)}`);
      
      if (!signature || !rawBody) {
        console.error("❌ Erro Fatal: Assinatura ou Corpo da requisição faltando.");
        return reply.status(400).send({ error: 'Missing signature or body' });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          rawBody, 
          signature,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
        console.log("✅ Assinatura validada com sucesso!");
      } catch (err: any) {
        // ESSE É O LOG MAIS IMPORTANTE
        console.error(`❌ ERRO DE ASSINATURA: ${err.message}`);
        console.error(`💡 Dica: Verifique se STRIPE_WEBHOOK_SECRET no Render bate com o segredo do endpoint .../stripe/webhook no Dashboard.`);
        return reply.status(400).send({ error: `Webhook Error: ${err.message}` });
      }

      // Se chegou aqui, a comunicação Stripe <-> Servidor está OK.
      // O problema pode ser na lógica do banco.

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const type = session.metadata?.type; 
        const stripeSessionId = session.id;

        console.log(`💰 Processando Pagamento: User=${userId}, Type=${type}`);

        if (userId && type) {
          try {
            // Verifica duplicidade
            const existingPayment = await prisma.payment.findUnique({
              where: { stripeSessionId: stripeSessionId }
            });

            if (existingPayment?.status === 'COMPLETED') {
              console.log('⚠️ Pagamento já processado anteriormente.');
              return reply.status(200).send({ received: true });
            }

            // Transação no Banco
            await prisma.$transaction(async (tx) => {
               // 1. Atualiza/Cria Pagamento
               await tx.payment.upsert({
                 where: { stripeSessionId: stripeSessionId },
                 create: {
                   userId,
                   stripeSessionId,
                   amount: session.amount_total ? session.amount_total / 100 : 30,
                   status: 'COMPLETED',
                   type: type as any 
                 },
                 update: { status: 'COMPLETED' }
               });

               // 2. Dá os créditos
               const fieldToIncrement = type === 'ELDER_EXTRA' ? 'elderCredits' : 'collaboratorCredits';
               console.log(`🆙 Incrementando ${fieldToIncrement} para usuário ${userId}`);
               
               await tx.user.update({
                 where: { id: userId },
                 data: {
                   [fieldToIncrement]: { increment: 1 }
                 }
               });
            });

            console.log(`✅ SUCESSO TOTAL: Créditos entregues.`);
          } catch (dbError) {
            console.error("❌ ERRO NO BANCO DE DADOS:", dbError);
            // Retornamos 500 para o Stripe tentar de novo
            return reply.status(500).send({ error: 'Database transaction failed' });
          }
        } else {
            console.error("❌ Erro: Metadata vazio. O checkout foi criado sem userId?");
        }
      } else {
        console.log(`ℹ️ Evento ignorado: ${event.type}`);
      }

      return reply.status(200).send({ received: true });
    }
  );
}