import { PasswordSchema } from '@repo/utils';
import { z } from 'zod';

export const EditProfileSchema = z
  .object({
    firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
    lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
    oldPassword: PasswordSchema.or(z.literal('')),
    newPassword: PasswordSchema.or(z.literal('')),
    repeatPassword: PasswordSchema.or(z.literal('')),
  })
  .refine((data) => data.newPassword === data.repeatPassword, {
    message: "Passwords don't match.",
    path: ['repeatPassword'],
  });

export type EditProfileSchemaType = z.infer<typeof EditProfileSchema>;
