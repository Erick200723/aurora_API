import { requirePaidPlan } from '../../hooks/requirePaidPlan.js';
import { registerCollaboratorSchema } from './collaborator.schemas.js';
import { registerCollaborator, } from './collaborator.service.js';
export default async function collaboratorRoutes(fastify) {
    const app = fastify.withTypeProvider();
    app.post('/register', {
        preHandler: requirePaidPlan,
        schema: {
            security: [{ bearerAuth: [] }],
            body: registerCollaboratorSchema,
            tags: ['Collaborator']
        }
    }, async (req) => {
        return registerCollaborator(req.body, req.user.id);
    });
}
