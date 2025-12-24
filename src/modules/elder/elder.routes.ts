import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createElderSchema } from './elder.schemas.js';
import { CreateElder } from './elder.service.js';
import { requirePaidPlan } from '../../hooks/requirePaidPlan.js';

export default async function elderRoutes(
  fastify: FastifyInstance
) {

  fastify.addHook('preHandler', async (request, reply) => {
    await request.jwtVerify();

    const user = request.user as { id: string; role: string };

    if (user.role !== 'FAMILIAR' && user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/',
    {
      preHandler: requirePaidPlan,
      schema: {
        body: createElderSchema
      }
    },
    async (request) => {
      return CreateElder({
        ...request.body,
        chiefId: (request.user as { id: string }).id
      });
    }
  );
}
