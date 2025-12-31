🔐 LOGIN NA STRIPE
stripe login


Vai abrir o navegador

Confirme sua conta

Volta para o terminal

🔁 TESTAR O WEBHOOK (AGORA SIM)

Com o backend rodando:

stripe listen --forward-to localhost:4000/stripe/webhook


Você verá:

Your webhook signing secret is whsec_********


👉 Coloque isso no .env:

STRIPE_WEBHOOK_SECRET=whsec_********

apois isso é só seguir os passos na doc swagger para pagamento
