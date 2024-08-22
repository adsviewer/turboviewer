import { z } from 'zod';
import { PasswordSchema, inviteHashLabel } from '@repo/utils';

export const SignUpSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().email(),
  password: PasswordSchema,
  [inviteHashLabel]: z.string().optional(),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: PasswordSchema,
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  password: PasswordSchema,
});

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;
export type SignInSchemaType = z.infer<typeof SignInSchema>;
export type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordSchemaType = z.infer<typeof ResetPasswordSchema>;
