import { z } from 'zod';
import { commonSchema, createEnv } from '@repo/utils';

const schema = z
  .object({
    NEXT_PUBLIC_GRAPHQL_ENDPOINT: z.string().min(1).default('http://localhost:4000/graphql'),
    NEXT_PUBLIC_ENDPOINT: z.string().min(1).default('http://localhost:3000'),
  })
  .merge(commonSchema);

export const env = createEnv(schema);

export const TOKEN_KEY = 'av_token';
export const REFRESH_TOKEN_KEY = 'av_refresh_token';
