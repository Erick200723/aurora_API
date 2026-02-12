import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { createElderSchema } from './elder.schemas.js';
import { CreateElder, getEldersByChief, deletElder } from './elder.service.js';
import { authenticate } from '../../hooks/authenticate.js';

export default async function elderRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post('/', {
    preHandler: [authenticate], 
    schema: {
      security: [{ bearerAuth: [] }],
      body: createElderSchema,
      tags: ['Elder'],
      description: 'Cadastra um idoso e vincula um login'
    }
  }, async (request) => {
    return CreateElder({ ...request.body, chiefId: request.user.id });
  });

  app.get('/my-elders', {
    preHandler: [authenticate],
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ['Elder'],
      response: { 200: z.array(z.any()) }
    }
  }, async (req) => {
    return getEldersByChief(req.user.id);
  });

  app.delete('/delete-elder', {
    preHandler: [authenticate],
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ['Elder'],
      params: z.object({ // CORREÇÃO: Zod no lugar de JSON manual
        id: z.string()
      }),
      description: "Remove um idoso e sua conta de acesso vinculada"
    }
  }, async (req) => {
    const { id } = req.params as { id: string };
    return deletElder(id, req.user.id);
  });
}