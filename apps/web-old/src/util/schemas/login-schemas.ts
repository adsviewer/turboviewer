import { z } from 'zod';
import { PasswordSchema } from '@repo/utils';

export const SignUpSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().email(),
  password: PasswordSchema,
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: PasswordSchema,
});

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;
