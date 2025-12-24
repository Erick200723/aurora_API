import { FastifyReply, FastifyRequest } from 'fastify';

export async function requirePaidPlan(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await request.jwtVerify();

  if (
    request.user.role !== 'FAMILIAR' &&
    request.user.role !== 'ADMIN'
  ) {
    return reply.status(403).send({ error: 'Access denied' });
  }

  // admin ignora pagamento
  if (request.user.role === 'ADMIN') {
    return;
  }

  const user = await request.server.prisma.user.findUnique({
    where: { id: request.user.id }
  });

  if (!user?.planPaid) {
    return reply.status(402).send({
      error: 'PLAN_REQUIRED'
    });
  }
}
