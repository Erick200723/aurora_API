import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';

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
import collaboratorRoutes from './modules/collaborator/collaborator.router.js';
import paymentRoutes from './modules/payment/payment.checkout.js';
import { stripeWebhook } from './modules/payment/payment.webhook.js';

const server = fastify({
  logger: true,
  bodyLimit: 1048576
}).withTypeProvider<ZodTypeProvider>();

// 🔴 ESSENCIAL para Zod + Swagger
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

// 🔹 RAW BODY → SÓ para Stripe webhook
server.addContentTypeParser(
  'application/json',
  { parseAs: 'buffer' },
  (req, body, done) => {
    if (req.url === '/stripe/webhook') {
      done(null, body);
    } else {
      done(null, JSON.parse(body.toString()));
    }
  }
);

// Plugins
await server.register(cors);
await server.register(multipart);
await server.register(prismaPlugin);
await server.register(jwtPlugin);

// Swagger
await server.register(swagger, {
  openapi: {
    info: {
      title: 'Aroura IA API',
      version: '1.0.0'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  transform: jsonSchemaTransform
});

await server.register(swaggerUI, {
  routePrefix: '/docs'
});

// Rotas
await server.register(authRoutes, { prefix: '/auth' });
await server.register(collaboratorRoutes, { prefix: '/collaborators' });
await server.register(elderRoutes, { prefix: '/elders' });
await server.register(paymentRoutes, { prefix: '/payment' });
await server.register(stripeWebhook, { prefix: '/stripe' });

// Server
await server.listen({ port: 4000, host: '0.0.0.0' });
console.log('Server running at http://localhost:4000');
console.log('Swagger docs at http://localhost:4000/docs');
