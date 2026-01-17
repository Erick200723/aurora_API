import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
});
export async function stripeWebhook(app) {
    app.post('/webhook', async (request, reply) => {
        const signature = request.headers['stripe-signature'];
        if (!signature) {
            return reply.status(400).send({ error: 'Missing signature' });
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(request.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            return reply.status(400).send({
                error: `Webhook Error: ${err.message} erro ao ao validar assinatura`,
            });
        }
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                if (userId) {
                    await prisma.payment.update({
                        where: { stripeSessionId: session.id },
                        data: { status: 'COMPLETED' },
                    });
                    await prisma.user.update({
                        where: { id: userId },
                        data: { planPaid: true },
                    });
                }
                break;
            }
            default:
                console.log(`Evento ignorado: ${event.type}`);
        }
        return reply.status(200).send({ received: true });
    });
}
