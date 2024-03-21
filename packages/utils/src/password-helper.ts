import { z } from 'zod';

const minPasswordLength = 8;

export const hasLowerCase = (val: string) => /.*[a-z].*/.test(val);
export const hasUpperCase = (val: string) => /.*[A-Z].*/.test(val);
export const hasNumber = (val: string) => /.*\d.*/.test(val);
export const hasSpecialCharacter = (val: string) => /[^a-zA-Z0-9]/.test(val);
export const hasMinLength = (val: string) => val.length >= minPasswordLength;

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
  })
  .refine(hasSpecialCharacter, {
    message: 'Password needs to have at least 1 special character',
  });
