import { z } from 'zod';

export const registerCollaboratorSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  elderCpf: z.string().length(11)
});

export const verifyCollaboratorSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

export type RegisterCollaboratorBody = z.infer<
  typeof registerCollaboratorSchema
>;

export type VerifyCollaboratorBody = z.infer<
  typeof verifyCollaboratorSchema
>;
