import { type ZodFormattedError } from 'zod';

export const flattenErrors = (
  error: ZodFormattedError<unknown>,
  path: string[],
): {
  path: string[];
  message: string;
}[] => {
  const errors = error._errors.map((message) => ({
    path,
    message,
  }));

  Object.keys(error).forEach((key) => {
    if (key !== '_errors') {
      errors.push(
        ...flattenErrors((error as Record<string, unknown>)[key] as ZodFormattedError<unknown>, [...path, key]),
      );
    }
  });

  return errors;
};
