import { z } from 'zod';

export const createElderSchema = z.object({
  name: z.string(),
  cpf: z.string().length(11),
  age: z.number().int().positive(),
  emergencyContact: z.string(),

  birthData: z
    .string()
    .optional()
    .refine(
      (value) => !value || !isNaN(Date.parse(value)),
      { message: 'birthData must be a valid ISO date' }
    ),

  medicalConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),

  createLogin: z.boolean(),

  email: z.string().email().optional(),
  password: z.string().min(6).optional()
});
