import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
export default fp(async (fastify) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET not defined');
    }
    fastify.register(jwt, {
        secret: jwtSecret
    });
    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.status(401).send(err);
        }
    });
});
