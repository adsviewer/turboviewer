export interface AError {
  error: true;
  message: string;
}

export const isAError = (obj: unknown): obj is AError => {
  return (
    Boolean(obj) && obj !== null && typeof obj === 'object' && 'error' in obj && obj.error === true && 'message' in obj
  );
};
