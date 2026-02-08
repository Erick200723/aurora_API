import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createElderSchema } from './elder.schemas.js';
import { CreateElder,getEldersByChief } from './elder.service.js';
import { requirePaidPlan } from '../../hooks/requirePaidPlan.js';
import { authenticate } from '../../hooks/authenticate.js';

export default async function elderRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/',
    {
      preHandler: requirePaidPlan,
      schema: {
        security: [{ bearerAuth: [] }],
        body: createElderSchema,
        tags: ['Elder']
      }
    },
    async (request) => {
      return CreateElder({
        ...request.body,
        chiefId: request.user.id
      });
    }
  );
  fastify.get('/my-elder',
    {preHandler: [authenticate]},
    async(req)=>{
      return getEldersByChief(req.user.id)
    }
  )
}
