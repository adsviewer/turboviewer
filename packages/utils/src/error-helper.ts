export type AError = Error;

export const isAError = (obj: unknown): obj is AError => {
  return (
    Boolean(obj) && obj !== null && typeof obj === 'object' && 'error' in obj && obj.error === true && 'message' in obj
  );
};
