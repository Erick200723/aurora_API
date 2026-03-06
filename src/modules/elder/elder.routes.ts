import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { createElderSchema } from './elder.schemas.js';
import { CreateElder, getEldersByChief, deletElder,UpdateElder,} from './elder.service.js';
import { getLogsByChief } from '../atividades/atividades.service.js';
import { authenticate } from '../../hooks/authenticate.js';

export default async function elderRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post('/', {
    preHandler: [authenticate], 
    schema: {
      security: [{ bearerAuth: [] }],
      body: createElderSchema.extend({
        typePlanetLife: z.string().optional() 
      }),
      tags: ['Elder'],
      description: 'Cadastra um idoso e vincula um login'
    }
  }, async (request) => {
    return CreateElder({
      ...request.body, 
      chiefId: request.user.id,
    });
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
      params: z.object({ 
        id: z.string()
      }),
      description: "Remove um idoso e sua conta de acesso vinculada"
    }
  }, async (req) => {
    const { id } = req.params as { id: string };
    return deletElder(id, req.user.id);
  });


  app.patch('/:id', {
    preHandler: [authenticate],
    schema: {
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
      body: z.object({
        bloodType: z.string().optional(),
        allergies: z.array(z.string()).optional(),
        medications: z.array(z.string()).optional(),
        medicalConditions: z.array(z.string()).optional(),
        observations: z.string().optional(),
        emergencyContact: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        typePlanetLife: z.string().optional(), // NOVO CAMPO ADICIONADO
      }),
      tags: ['Elder'],
      description: 'Atualiza a ficha médica do idoso'
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    return UpdateElder(id, request.user.id, request.body);
  });

  app.get('/logs', {
    preHandler: [authenticate],
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ['Elder'],
      description: 'Busca o histórico de atividades do Admin'
    }
  }, async (req) => {
    return getLogsByChief(req.user.id);
  });
}
