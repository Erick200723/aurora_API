import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { check, string } from 'zod';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

type PaymentType = "ELDER_EXTRA" | "COLLABORATOR";

const PRICE = {
    ELDER_EXTRA: 1000, //equivale a 10.00 BR
    COLLABORATOR: 1000, //equivale a 10.00 BR
}

export async function createCheckoutSession(
    userId: string,
    type: PaymentType
){
    const amount = PRICE[type];

    if(!amount){
        throw{
            code: "INVALID_PAYMENT_TYPE",
            message: "Invalid payment type",
            status_code: 400
        };
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items:[{
            price_data: {
                currency: 'brl',
                product_data:{
                    name: type === "COLLABORATOR"
                    ?'Colaborador adicional'
                    :'Extra idoso'
                },
                unit_amount: amount
            },
            quantity: 1
        }
    ],
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata:{
            userId, type
        }
    });

    await prisma.payment.create({
        data:{
            userId,
            type,
            amount,
            stripeSessionId: session.id,
            status: 'PENDING'
        }
    });
    if(!session.url){
        throw{
            code: "SESSION_URL_NOT_FOUND",
            message: "Checkout session URL not found",
            status_code: 500
        };
    }
   return{
    checkoutUrl: session.url
   }
}