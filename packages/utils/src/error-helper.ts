import { type ZodError } from 'zod';

export class AError extends Error {
  private zodError?: ZodError | undefined;
  constructor(message: string, zodError?: ZodError) {
    super(message);
    this.name = 'AError';
    this.zodError = zodError;
  }
}

export const isAError = (obj: unknown): obj is AError => {
  return obj instanceof Error;
};
