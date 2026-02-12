import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod"; // Importação necessária para corrigir o Swagger
import { authenticate } from '../../hooks/authenticate.js';
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
  }, async (req) => {
    return await registerFamiliar(req.body);
  });

  /* ================= LOGIN (FAMILIAR/ADMIN) ================= */
  app.post("/login", { 
    schema: { 
      body: loginSchema, 
      tags: ["Autenticação"],
      description: "Inicia o login e envia OTP para e-mail" 
    } 
  }, async (req) => {
    return await loginUser(req.body.email, req.body.password);
  });

  /* ================= LOGIN ELDER ================= */
  app.post("/login-elder", { 
    schema: { 
      body: loginElderSchema, 
      tags: ["Autenticação"],
      description: "Inicia o login para idosos cadastrados" 
    } 
  }, async (req) => {
    return await loginElder(req.body.email);
  });

  /* ================= VERIFY OTP & GENERATE TOKEN ================= */
  app.post("/verify", { 
    schema: { 
      body: verifyCodeSchema, 
      tags: ["Autenticação"],
      description: "Valida o OTP e gera o token de acesso (JWT)" 
    } 
  }, async (req, reply) => {
    const user = await verifyCode(req.body.email, req.body.code);
    const token = fastify.jwt.sign({
      id: user.id,
      role: user.role,
      elderId: user.elderProfileId || undefined 
    }, { expiresIn: "7d" });

    return reply.send({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        elderId: user.elderProfileId
      },
      token: token ?? undefined
    });
  });

  /* ================= RESEND OTP ================= */
  app.post("/resend-otp", { 
    schema: { 
      body: resendOTPSchema, 
      tags: ["Autenticação"] 
    } 
  }, async (req) => {
    return await resendOTP(req.body.email, req.ip);
  });

  /* ================= DEBUG/ADMIN ROUTES ================= */
  app.get("/all-users", { 
    schema: { 
      tags: ["Admin"],
      response: { 200: z.array(z.any()) } // Zod fix
    } 
  }, async () => getAllUsers());

  app.get("/all-elders", { 
    schema: { 
      tags: ["Admin"],
      response: { 200: z.array(z.any()) } // Zod fix
    } 
  }, async () => getAllElders());

  app.patch("/update-name", {
    preHandler: [authenticate],
    schema: {
      tags: ["Perfil"],
      security: [{ bearerAuth: [] }],
      body: z.object({ // CORREÇÃO: Removido JSON manual por Zod
        name: z.string().min(2)
      })
    }
  }, async (req) => {
    return await putNameUser(req.user.id, (req.body as any).name);
  });

  app.delete("/me", {
    preHandler: [authenticate],
    schema: {
      tags: ["Perfil"],
      security: [{ bearerAuth: [] }],
      description: "Deleta a conta do usuário logado"
    }
  }, async (req) => {
    return await deletFamiliarAdim(req.user.id);
  });
}