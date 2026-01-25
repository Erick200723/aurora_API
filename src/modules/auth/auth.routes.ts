import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
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
  getAllElders
} from "./auth.service.js";

export default async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  /* ================= REGISTER ================= */
  app.post("/register", { schema: { body: registerSchema, tags: ["Auth"] } }, async (req, reply) => {
    try {
      return await registerFamiliar(req.body);
    } catch (err: any) {
      if (err.message === "EMAIL_ALREADY_REGISTERED") {
        return reply.status(400).send({ message: "Email já registrado" });
      }
      throw err;
    }
  });

  /* ================= LOGIN ================= */
  app.post("/login", { schema: { body: loginSchema } }, async (req, reply) => {
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
  app.post("/login-elder", { schema: { body: loginElderSchema } }, async (req, reply) => {
    try {
      return await loginElder(req.body.email);
    } catch (err: any) {
      if (err.message === "INVALID_CREDENTIALS") {
        return reply.status(400).send({ message: "Credenciais inválidas" });
      }
      throw err;
    }
  });

  /* ================= VERIFY OTP ================= */
  app.post(
    "/verify",
    { schema: { body: verifyCodeSchema } },
    async (req, reply) => {
      try {
        const user = await verifyCode(req.body.email, req.body.code);

        const token = fastify.jwt.sign({
          id: user.id,
          role: user.role
        },
        { expiresIn: "7d" }
      );

        return reply.send({
          user,
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
  app.post("/resend-otp", { schema: { body: resendOTPSchema } }, async (req, reply) => {
    try {
      return await resendOTP(req.body.email, req.ip);
    } catch (err: any) {
      if (err.message === "RESEND_LIMIT_EXCEEDED") {
        return reply.status(429).send({ message: "Limite de reenvio excedido" });
      }
      throw err;
    }
  });

  app.get("/all-users", async () => getAllUsers());
  app.get("/all-elders", async () => getAllElders());
}
