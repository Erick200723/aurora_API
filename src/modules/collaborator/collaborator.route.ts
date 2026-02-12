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

  app.post(
    '/register',
    {
      // Adicione o authenticate aqui para podermos pegar o req.user.id se precisar
      preHandler: [authenticate], 
      schema: {
        security: [{ bearerAuth: [] }],
        body: registerCollaboratorSchema,
        tags: ['Collaborator']
      }
    },
    async (req) => {
      // O service agora cuida da lógica de créditos e vinculação
      return registerCollaborator(req.body);
    }
  );

  app.get('/my-collaborators',
    { preHandler: [authenticate] },
    async (req) => {
      return getCollaboratorsByChief(req.user.id);
    }
  );

  app.get('/get-all-collaborators', async () => getAllCollaborators());

  app.delete('/delete-colaborador',{
     preHandler: [authenticate], 
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ['Collaborator'],
      params: { // Validando que o ID deve ser uma string (ObjectId)
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  },
  async(req)=>{
    const { id } = req.params as { id: string };
    return deletCollaborator(id, req.user.id);
  }
  )
}