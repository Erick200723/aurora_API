import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  registerSchema,
  loginSchema,
  verifyCodeSchema,
  loginElderSchema
} from './auth.schemas.js';

import {
  registerFamiliar,
  loginUser,
  loginElder,
  verifyCode,
  resendOTP
} from './auth.service.js';


export default async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post('/register', { schema: { body: registerSchema } }, async (req) => {
    return registerFamiliar(req.body);
  });

  app.post('/login', { schema: { body: loginSchema } }, async (req) => {
    return loginUser(req.body.email, req.body.password);
  });

  app.post('/login-elder', { schema: { body: loginElderSchema } }, async (req) => {
    return loginElder(req.body.email);
  });

  app.post('/verify', { schema: { body: verifyCodeSchema } }, async (req) => {
    const user = await verifyCode(req.body.email, req.body.code);

    if (!user) {
      throw new Error('Invalid or expired code');
    }

    return {
      token: fastify.jwt.sign({
        id: user.id,
        role: user.role
      })
    };
  });
  app.post('/admin/fake-pay/:userId', async (request) => {
    const { userId } = request.params as { userId: string };

    return request.server.prisma.user.update({
      where: { id: userId },
      data: { planPaid: true }
    });
  });
  app.post('/resend', async (req) => {
      const { email } = req.body as { email: string };
      const ip = req.ip ?? 'unknown';

      return resendOTP(email, ip);
  });


}

