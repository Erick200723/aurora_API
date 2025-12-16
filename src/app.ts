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
import collaboratorRoutes from './collaborator/collaborator.router.js';

const server = fastify({
  logger: true
}).withTypeProvider<ZodTypeProvider>();

// 🔴 ESSENCIAL
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

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
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  transform: jsonSchemaTransform
});

await server.register(swaggerUI, {
  routePrefix: '/docs'
});

await server.register(cors);
await server.register(multipart);

await server.register(prismaPlugin);
await server.register(jwtPlugin);
await server.register(collaboratorRoutes, { prefix: '/collaborators' });


await server.register(authRoutes, { prefix: '/auth' });
await server.register(elderRoutes, { prefix: '/elders' });

await server.listen({ port: 4000, host: '0.0.0.0' });
