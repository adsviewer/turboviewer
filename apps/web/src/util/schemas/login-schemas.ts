import { z } from 'zod';
import { PasswordSchema } from '@repo/utils';

export const SignUpSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: PasswordSchema,
});

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;
