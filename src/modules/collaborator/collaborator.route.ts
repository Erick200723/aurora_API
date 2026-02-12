import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authenticate } from '../../hooks/authenticate.js';

import {
  registerCollaboratorSchema,
  // ... outros schemas
} from './collaborator.schemas.js';

import {
  registerCollaborator,
  getAllCollaborators,
  getCollaboratorsByChief,
  deletCollaborator
} from './collaborator.service.js';

export default async function collaboratorRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post('/register', {
    preHandler: [authenticate], 
    schema: { tags: ['Colaboradores'], security: [{ bearerAuth: [] }], body: registerCollaboratorSchema }
  }, async (req) => registerCollaborator(req.body));

  app.get('/my-collaborators', {
    preHandler: [authenticate],
    schema: { tags: ['Colaboradores'], security: [{ bearerAuth: [] }], description: "Lista colaboradores do Chief logado" }
  }, async (req) => getCollaboratorsByChief(req.user.id));

  app.delete('/:id', {
    preHandler: [authenticate], 
    schema: { tags: ['Colaboradores'], security: [{ bearerAuth: [] }], params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } }
  }, async (req) => deletCollaborator((req.params as any).id, req.user.id));
}