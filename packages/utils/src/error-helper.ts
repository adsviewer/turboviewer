export interface MError {
  error: true;
  message: string;
}

export const isMError = (obj: unknown): obj is MError => {
  return (
    Boolean(obj) && obj !== null && typeof obj === 'object' && 'error' in obj && obj.error === true && 'message' in obj
  );
};
