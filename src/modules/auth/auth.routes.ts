import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {authenticate} from '../../hooks/authenticate.js'
import {
  registerSchema,
  loginSchema,
  verifyCodeSchema,
  loginElderSchema,
  resendOTPSchema
} from "./auth.schemas.js";

import {
  registerFamiliar,
  loginUser,
  loginElder,
  verifyCode,
  resendOTP,
  getAllUsers,
  getAllElders,
  putNameUser,
  deletFamiliarAdim
} from "./auth.service.js";

export default async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // TAG: Autenticação
  app.post("/register", { schema: { body: registerSchema, tags: ["Autenticação"],
     description: "Registra um novo familiar/admin" 
    } 
  }, async (req) => registerFamiliar(req.body));

  app.post("/login", { schema: { body: loginSchema, tags: ["Autenticação"],
     description: "Inicia login e envia OTP" }
     }, async (req) => loginUser(req.body.email, req.body.password));

  app.post("/login-elder", { schema: { body: loginElderSchema, tags: ["Autenticação"],
     description: "Login simplificado para Idosos" }
     }, async (req) => loginElder(req.body.email));

  app.post("/verify", { schema: { body: verifyCodeSchema, tags: ["Autenticação"],
     description: "Valida OTP e gera JWT" } 
    }, async (req, reply) => {
      const user = await verifyCode(req.body.email, req.body.code);
      const token = fastify.jwt.sign({ id: user.id, role: user.role, elderProfileId: user.elderProfileId }, { expiresIn: "7d" });
      return reply.send({ user, token });
  });

  app.post("/resend-otp", { schema: { body: resendOTPSchema,
     tags: ["Autenticação"] }
     },
      async (req) => resendOTP(req.body.email, req.ip));

  app.patch("/update-name", { 
    preHandler: [authenticate], 
    schema: { tags: ["Perfil"],
       security: [{ bearerAuth: [] }],
        body: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } } 
  }, async (req) => putNameUser(req.user.id, (req.body as any).name));

  app.delete("/me", { 
    preHandler: [authenticate], 
    schema: { tags: ["Perfil"], security: [{ bearerAuth: [] }], description: "Deleta a conta do usuário logado" } 
  }, async (req) => deletFamiliarAdim(req.user.id));

  app.get("/all-users", { schema: { tags: ["Admin"] } }, async () => getAllUsers());
}