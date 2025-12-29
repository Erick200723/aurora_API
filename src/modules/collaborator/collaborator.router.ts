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
} from './collaborator.service.js';

export default async function collaboratorRoutes(
  fastify: FastifyInstance
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    '/register',
    {
      preHandler: requirePaidPlan,
      schema: {
        security: [{ bearerAuth: [] }],
        body: registerCollaboratorSchema,
        tags: ['Collaborator']
      }
    },
    async (req) => {
      return registerCollaborator(
        req.body as RegisterCollaboratorBody,
        req.user.id
      );
    }
  );

}
