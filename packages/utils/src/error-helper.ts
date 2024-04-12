export class AError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AError';
  }
}

export const isAError = (obj: unknown): obj is AError => {
  return obj instanceof Error;
};
