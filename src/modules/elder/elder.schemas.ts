import { z } from 'zod';

export const createElderSchema = z.object({
  name: z.string().min(2),
  cpf: z.string().length(11),
  age: z.number().min(50),
  emergencyContact: z.string().min(8),

  birthData: z.string().optional(),
  medicalConditions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),

  createLogin: z.boolean().default(false),
  email: z.string().email().optional(),
  password: z.string().min(6).optional()
});