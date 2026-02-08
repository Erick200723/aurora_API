import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requirePaidPlan } from '../../hooks/requirePaidPlan.js';

import {
  registerCollaboratorSchema,
  verifyCollaboratorSchema,
  RegisterCollaboratorBody,
  VerifyCollaboratorBody
} from './collaborator.schemas.js';

import {
  registerCollaborator,
  getAllCollaborators,
  getCollaboratorsByChief
} from './collaborator.service.js';

export default async function collaboratorRoutes(
  fastify: FastifyInstance
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    '/register',
    {
      schema: {
        security: [{ bearerAuth: [] }],
        body: registerCollaboratorSchema,
        tags: ['Collaborator']
      }
    },
    async (req) => {
      return registerCollaborator(
        req.body,
      );
    }
  );

  app.get('/my-collaborators',
    {preHandler: [fastify.authenticate]},
    async(req)=>{
      return getCollaboratorsByChief(req.user.id)
    }
  )

  app.get('/get-all-collaborators', async() => getAllCollaborators());
  
  }
