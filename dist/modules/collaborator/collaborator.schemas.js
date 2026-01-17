import { z } from 'zod';
export const registerCollaboratorSchema = z.object({
    name: z.string().describe("Nome completo do colaborador"),
    email: z.string().email().describe("Email do colaborador"),
    password: z.string().min(6).describe("Senha do colaborador"),
    elderCpf: z.string().length(11).describe("CPF do idoso associado ao colaborador"),
});
export const verifyCollaboratorSchema = z.object({
    email: z.string().email().describe("Email do colaborador"),
    code: z.string().length(6).describe("Código de verificação")
});
