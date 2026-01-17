import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import prismaPlugin from './plugins/prisma.js';
import jwtPlugin from './plugins/jwt.js';
import authRoutes from './modules/auth/auth.routes.js';
import elderRoutes from './modules/elder/elder.routes.js';
import collaboratorRoutes from './modules/collaborator/collaborator.router.js';
import paymentRoutes from './modules/payment/payment.checkout.js';
import { stripeWebhook } from './modules/payment/payment.webhook.js';
import cookie from "@fastify/cookie";
const server = fastify({
    logger: true,
    bodyLimit: 1048576
}).withTypeProvider();
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);
server.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    if (req.url.startsWith('/stripe/webhook')) {
        done(null, body);
    }
    else {
        done(null, JSON.parse(body.toString()));
    }
});
await server.register(cors, {
    origin: [
        'http://26.79.85.211:3000',
        'http://localhost:3000',
        'https://aurora-dashboard-one.vercel.app'
    ],
    credentials: true
});
await server.register(cookie, {
    secret: process.env.COOKIE_SECRET || "aurora-secret",
});
await server.register(multipart);
await server.register(prismaPlugin);
await server.register(jwtPlugin);
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
await server.register(authRoutes, { prefix: '/auth' });
await server.register(collaboratorRoutes, { prefix: '/collaborators' });
await server.register(elderRoutes, { prefix: '/elders' });
await server.register(paymentRoutes, { prefix: '/payment' });
await server.register(stripeWebhook, { prefix: '/stripe' });
const PORT = Number(process.env.PORT) || 4000;
server.listen({ port: PORT, host: "0.0.0.0" });
console.log(`Server running on port ${PORT}`);
console.log(`Swagger docs at /docs`);
