import { z } from 'zod';
import { describe } from 'zod/v4/core';

export const createElderSchema = z.object({
  name: z.string().describe('Nome completo do idoso'),
  cpf: z.string().length(11).describe('CPF do idoso, apenas números'),
  age: z.number().int().positive().describe('Idade do idoso'),
  emergencyContact: z.string().describe('Contato de emergência do idoso'),

  birthData: z
    .string()
    .optional()
    .refine(
      (value) => !value || !isNaN(Date.parse(value)),
      { message: 'birthData must be a valid ISO date' }
    ).describe('Data de nascimento do idoso em formato ISO'),

  medicalConditions: z.array(z.string()).optional().describe('Condições médicas do idoso'),
  medications: z.array(z.string()).optional().describe('Medicamentos do idoso'),

  createLogin: z.boolean().describe('Criar login para o idoso'),

  email: z.string().email().optional().describe('Email do idoso, necessário se createLogin for true'),
  password: z.string().min(6).optional().describe('Senha do idoso, necessário se createLogin for true'),
});
