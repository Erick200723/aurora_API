import { createElderSchema } from './elder.schemas.js';
import { CreateElder } from './elder.service.js';
import { requirePaidPlan } from '../../hooks/requirePaidPlan.js';
export default async function elderRoutes(fastify) {
    fastify.withTypeProvider().post('/', {
        preHandler: requirePaidPlan,
        schema: {
            security: [{ bearerAuth: [] }],
            body: createElderSchema,
            tags: ['Elder']
        }
    }, async (request) => {
        return CreateElder({
            ...request.body,
            chiefId: request.user.id
        });
    });
}
