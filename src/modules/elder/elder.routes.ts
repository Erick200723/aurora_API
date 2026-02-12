import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createElderSchema } from './elder.schemas.js';
import { CreateElder, getEldersByChief,deletElder } from './elder.service.js';
import { authenticate } from '../../hooks/authenticate.js';

export default async function elderRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post('/', {
    preHandler: [authenticate], 
    schema: { tags: ['Idosos'], security: [{ bearerAuth: [] }], body: createElderSchema }
  }, async (req) => CreateElder({ ...req.body, chiefId: req.user.id }));

  app.get('/my-elders', {
    preHandler: [authenticate],
    schema: { tags: ['Idosos'], security: [{ bearerAuth: [] }] }
  }, async (req) => getEldersByChief(req.user.id));

  app.delete('/:id', {
    preHandler: [authenticate],
    schema: { tags: ['Idosos'], security: [{ bearerAuth: [] }], params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } }
  }, async (req) => deletElder((req.params as any).id, req.user.id));
}