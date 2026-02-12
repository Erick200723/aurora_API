import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authenticate } from '../../hooks/authenticate.js';
import { registerCollaboratorSchema } from './collaborator.schemas.js';
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
    schema: {
      security: [{ bearerAuth: [] }],
      body: registerCollaboratorSchema,
      tags: ['Collaborator']
    }
  }, async (req) => {
    return registerCollaborator(req.body);
  });

  app.get('/my-collaborators', { 
    preHandler: [authenticate],
    schema: {
      tags: ['Collaborator'],
      security: [{ bearerAuth: [] }],
      response: { 200: z.array(z.any()) }
    }
  }, async (req) => {
    return getCollaboratorsByChief(req.user.id);
  });

  app.get('/get-all-collaborators', {
    schema: {
      tags: ['Collaborator'],
      response: { 200: z.array(z.any()) }
    }
  }, async () => getAllCollaborators());

  app.delete('/delete-colaborador', {
    preHandler: [authenticate], 
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ['Collaborator'],
      params: z.object({ // CORREÇÃO: Zod no lugar de JSON manual
        id: z.string()
      })
    }
  }, async (req) => {
    const { id } = req.params as { id: string };
    return deletCollaborator(id, req.user.id);
  });
}