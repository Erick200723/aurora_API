import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createElderSchema } from './elder.schemas.js';
import { CreateElder, getEldersByChief,deletElder } from './elder.service.js';
import { authenticate } from '../../hooks/authenticate.js';

export default async function elderRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Criar Idoso (com amarração de login)
  app.post(
    '/',
    {
      preHandler: [authenticate], 
      schema: {
        security: [{ bearerAuth: [] }],
        body: createElderSchema,
        tags: ['Elder'],
        description: 'Cadastra um idoso e vincula um login (role IDOSO) se solicitado'
      }
    },
    async (request) => {
      // Passamos o ID do Chief (usuário logado) para o serviço
      return CreateElder({
        ...request.body,
        chiefId: request.user.id
      });
    }
  );

  // Buscar idosos gerenciados pelo Chief logado
  app.get('/my-elders', // Mudei para plural para ser semântico
    {
      preHandler: [authenticate],
      schema: {
        security: [{ bearerAuth: [] }],
        tags: ['Elder'],
        description: 'Retorna todos os idosos vinculados ao administrador logado'
      }
    },
    async (req) => {
      return getEldersByChief(req.user.id);
    }
  );

  app.delete('/delete-elder',{
      preHandler: [authenticate],
      schema: {
        security: [{ bearerAuth: [] }],
        tags: ['Elder'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        },
        description: "Remove um idoso e sua conta de acesso vinculada"
      }
    },
    async(req)=>{
      const { id } = req.params as { id: string };
      return deletElder(id, req.user.id);
    }
    )
}