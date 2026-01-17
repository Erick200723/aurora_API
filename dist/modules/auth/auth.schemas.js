import { z } from 'zod';
export const registerSchema = z.object({
    name: z.string().min(2).describe('Nome completo do usuário'),
    email: z.string().email().describe("Email do usuário"),
    password: z.string().min(6).describe("Senha do usuário")
});
export const loginSchema = z.object({
    email: z.string().email().describe("Email do usuário"),
    password: z.string().min(6).describe("Senha do usuário")
});
export const verifyCodeSchema = z.object({
    email: z.string().email().describe("Email do usuário"),
    code: z.string().length(6).describe("Código de verificação")
});
export const loginElderSchema = z.object({
    email: z.string().email().describe("Email do idoso")
});
export const registerCollaboratorSchema = z.object({
    name: z.string().min(2).describe("Nome completo do colaborador"),
    email: z.string().email().describe("Email do colaborador"),
    password: z.string().min(6).describe("Senha do colaborador"),
    elderCpf: z.string().length(11).describe("CPF do idoso associado ao colaborador")
});
export const resendOTPSchema = z.object({
    email: z.string().email().describe("Email do usuário"),
});
