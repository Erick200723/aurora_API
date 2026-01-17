import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default fp(async (fastify, opts) => {
    fastify.decorate('prisma', prisma);
    fastify.addHook('onClose', async (fastify) => {
        await prisma.$disconnect();
    });
});
