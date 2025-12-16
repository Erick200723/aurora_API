import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import {
  registerCollaboratorSchema,
  verifyCollaboratorSchema,
  RegisterCollaboratorBody,
  VerifyCollaboratorBody
} from './collaborator.schemas.js';

import {
  registerCollaborator,
  verifyCollaborator
} from './collaborator.service.js';

export default async function collaboratorRoutes(
  fastify: FastifyInstance
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    '/register',
    {
      schema: {
        body: registerCollaboratorSchema
      }
    },
    async (req) => {
      return registerCollaborator(req.body as RegisterCollaboratorBody);
    }
  );

  app.post(
    '/verify',
    {
      schema: {
        body: verifyCollaboratorSchema
      }
    },
    async (req) => {
      const user = await verifyCollaborator(
        (req.body as VerifyCollaboratorBody).email,
        (req.body as VerifyCollaboratorBody).code
      );

      return {
        token: fastify.jwt.sign({
          id: user.id,
          role: user.role
        })
      };
    }
  );
}
