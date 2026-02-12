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

  /* ================= REGISTER ================= */
  app.post("/register", { 
    schema: { 
      body: registerSchema, 
      tags: ["Autenticação"],
      description: "Registra um novo usuário familiar/admin" 
    } 
  }, async (req, reply) => {
    try {
      return await registerFamiliar(req.body);
    } catch (err: any) {
      if (err.message === "EMAIL_ALREADY_REGISTERED") {
        return reply.status(400).send({ message: "Email já registrado" });
      }
      throw err;
    }
  });

  /* ================= LOGIN (FAMILIAR/ADMIN) ================= */
  app.post("/login", { 
    schema: { 
      body: loginSchema, 
      tags: ["Autenticação"],
      description: "Inicia o login e envia OTP para e-mail" 
    } 
  }, async (req, reply) => {
    try {
      return await loginUser(req.body.email, req.body.password);
    } catch (err: any) {
      if (err.message === "INVALID_CREDENTIALS") {
        return reply.status(400).send({ message: "Credenciais inválidas" });
      }
      throw err;
    }
  });

  /* ================= LOGIN ELDER ================= */
  app.post("/login-elder", { 
    schema: { 
      body: loginElderSchema, 
      tags: ["Autenticação"],
      description: "Inicia o login para idosos cadastrados" 
    } 
  }, async (req, reply) => {
    try {
      return await loginElder(req.body.email);
    } catch (err: any) {
      if (err.message === "INVALID_CREDENTIALS") {
        return reply.status(400).send({ message: "Credenciais inválidas" });
      }
      throw err;
    }
  });

  /* ================= VERIFY OTP & GENERATE TOKEN ================= */
  app.post(
    "/verify",
    { 
      schema: { 
        body: verifyCodeSchema, 
        tags: ["Autenticação"],
        description: "Valida o OTP e gera o token de acesso (JWT)" 
      } 
    },
    async (req, reply) => {
      try {
        const user = await verifyCode(req.body.email, req.body.code);
        const token = fastify.jwt.sign({
          id: user.id,
          role: user.role,
          elderId: user.elderProfileId || undefined 
        },
        { expiresIn: "7d" }
      );

        return reply.send({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            elderId: user.elderProfileId // Retorno explícito para o estado do Front
          },
          token: token ?? undefined
        });
      } catch (err: any) {
        if (err.message === "INVALID_CODE") {
          return reply.status(400).send({ message: "Código inválido" });
        }
        if (err.message === "CODE_EXPIRED") {
          return reply.status(400).send({ message: "Código expirado" });
        }
        throw err;
      }
    }
  );

  /* ================= RESEND OTP ================= */
  app.post("/resend-otp", { 
    schema: { 
      body: resendOTPSchema, 
      tags: ["Autenticação"] 
    } 
  }, async (req, reply) => {
    try {
      return await resendOTP(req.body.email, req.ip);
    } catch (err: any) {
      if (err.message === "RESEND_LIMIT_EXCEEDED") {
        return reply.status(429).send({ message: "Limite de reenvio excedido" });
      }
      throw err;
    }
  });

  /* ================= DEBUG/ADMIN ROUTES ================= */
  app.get("/all-users", { schema: { tags: ["Admin"] } }, async () => getAllUsers());
  app.get("/all-elders", { schema: { tags: ["Admin"] } }, async () => getAllElders());

  app.patch("/update-name", {
    preHandler: [authenticate],
    schema: {
      tags: ["Perfil"],
      body: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name']
      },
      security: [{ bearerAuth: [] }]
    }
  }, async (req) => {
    return await putNameUser(req.user.id, (req.body as any).name);
  });

  app.delete("/me", {
    preHandler: [authenticate],
    schema: {
      tags: ["Perfil"],
      description: "Deleta a conta do usuário logado",
      security: [{ bearerAuth: [] }]
    }
  }, async (req) => {
    return await deletFamiliarAdim(req.user.id);
  });
}