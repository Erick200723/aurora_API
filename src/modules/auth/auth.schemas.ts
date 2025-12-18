import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

export const loginElderSchema = z.object({
  email: z.string().email()
});

export const registerCollaboratorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  elderCpf: z.string().length(11)
});

export const resendOTPSchema = z.object({
  email: z.string().email(),
  ip: z.string().optional(),
  tx: z.string().optional(),
});
