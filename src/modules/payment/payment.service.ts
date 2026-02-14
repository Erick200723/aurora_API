import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover', 
});

export type PaymentType = "ELDER_EXTRA" | "COLLABORATOR";

const PRICE = {
    ELDER_EXTRA: 3000,   // R$ 30,00
    COLLABORATOR: 3000,  // R$ 30,00
}

export async function createCheckoutSession(
    userId: string,
    type: PaymentType
){
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
    });

    if (!user) {
        throw { code: "USER_NOT_FOUND", message: "Usuário não encontrado", status_code: 404 };
    }

    const amount = PRICE[type];


    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: user.email, 
        line_items:[{
            price_data: {
                currency: 'brl',
                product_data:{
                    name: type === "COLLABORATOR" 
                        ? 'Crédito: Colaborador Adicional' 
                        : 'Crédito: Idoso Adicional'
                },
                unit_amount: amount
            },
            quantity: 1
        }],
        success_url: `${process.env.FRONTEND_URL}/admin/painel?success=true`, 
        cancel_url: `${process.env.FRONTEND_URL}/admin/painel?cancel=false`,
        metadata:{
            userId, 
            type 
        }
    });

    if(!session.url){
        throw new Error("Stripe session URL is null")
    }



    return { 
        checkoutUrl: session.url 
    }
}