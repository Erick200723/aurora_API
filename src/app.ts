import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import socketio from 'fastify-socket.io'; 
import { Socket } from 'socket.io';
import cookie from "@fastify/cookie";
import cron from 'node-cron';

import {
  ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler
} from 'fastify-type-provider-zod';

import prismaPlugin from './plugins/prisma.js';
import jwtPlugin from './plugins/jwt.js';

import authRoutes from './modules/auth/auth.routes.js';
import elderRoutes from './modules/elder/elder.routes.js';
import collaboratorRoutes from './modules/collaborator/collaborator.route.js';
import paymentRoutes from './modules/payment/payment.checkout.js';
import remiderRoutes from './modules/reminder/reminder.routes.js';
import emergencyRoutes from './modules/emergency/emergency.route.js'; // Nova rota
import { stripeWebhook } from './modules/payment/payment.webhook.js';
import { dailyResetReminders } from './modules/reminder/reminder.service.js';
import { string } from 'zod';

const server = fastify({
  logger: true,
  bodyLimit: 1048576
}).withTypeProvider<ZodTypeProvider>();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

// Configuração para o Webhook do Stripe (Buffer)
server.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
  if (req.url === '/stripe/webhook') { 
    done(null, body);
  } else {
    try {
      done(null, JSON.parse(body.toString()));
    } catch (e) {
      done(e as Error);
    }
  }
});;

// 1. Configuração de CORS (Alinhada com o Socket.io)
const corsOptions = {
  origin: [
    'http://26.79.85.211:3000',
    'http://localhost:3000',
    'https://aurora-dashboard-one.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
};

await server.register(cors, corsOptions);

// 2. Registro do Socket.io
await server.register(socketio, {
  cors: corsOptions // Usa as mesmas permissões do seu app
});

await server.register(cookie, {
  secret: process.env.COOKIE_SECRET || "aurora-secret",
});

await server.register(multipart);
await server.register(prismaPlugin);
await server.register(jwtPlugin);

server.ready().then(() => {
  server.io.on('connection', (socket:Socket) => {
    console.log(`🔌 Novo cliente conectado: ${socket.id}`);

    socket.on('join_room', (userId) => {
      socket.join(userId);
      console.log(`👤 Usuário ${userId} entrou na sala de monitoramento`);
    });

    socket.on('disconnect', () => {
      console.log('❌ Cliente desconectado');
    });
  });
});

await server.register(swagger, {
  openapi: {
    info: { title: 'Aurora IA API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  transform: jsonSchemaTransform
});

await server.register(swaggerUI, { routePrefix: '/docs' });

// Cron Job
cron.schedule('0 0 * * *', async () => {
    console.log('Iniciando limpeza diária dos lembretes...');
    await dailyResetReminders();
});

// Registro de Rotas
await server.register(authRoutes, { prefix: '/auth' });
await server.register(collaboratorRoutes, { prefix: '/collaborators' });
await server.register(elderRoutes, { prefix: '/elders' });
await server.register(paymentRoutes, { prefix: '/payment' });
await server.register(stripeWebhook, { prefix: '/stripe' });
await server.register(remiderRoutes, { prefix: '/reminders' });
await server.register(emergencyRoutes, { prefix: '/emergencies' }); // Registrada!

const PORT = Number(process.env.PORT) || 4000;

server.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📜 Swagger docs at http://localhost:${PORT}/docs`);
});