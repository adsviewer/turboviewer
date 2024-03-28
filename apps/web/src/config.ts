import { z } from 'zod';
import { createEnv } from '@repo/utils';

const schema = z.object({
  NEXT_PUBLIC_GRAPHQL_ENDPOINT: z.string().min(1).default('http://localhost:4000/graphql'),
  NEXT_PUBLIC_ENDPOINT: z.string().min(1).default('http://localhost:3000'),
});

export const env = createEnv(schema);
