import { z } from 'zod';

const minPasswordLength = 8;

export const hasLowerCase = (val: string): boolean => /[a-z]+/.test(val);
export const hasUpperCase = (val: string): boolean => /[A-Z]+/.test(val);
export const hasNumber = (val: string): boolean => /\d+/.test(val);

export const PasswordSchema = z
  .string()
  .min(minPasswordLength, { message: `Password has to be minimum ${String(minPasswordLength)} characters` })
  .refine(hasLowerCase, {
    message: 'Password needs to have at least 1 lowercase letter',
  })
  .refine(hasUpperCase, {
    message: 'Password needs to have at least 1 uppercase letter',
  })
  .refine(hasNumber, {
    message: 'Password needs to have at least 1 number',
  });
