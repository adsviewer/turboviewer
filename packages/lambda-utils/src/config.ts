import { z } from 'zod';
import { awsSchema, createEnv } from '@repo/utils';

const schema = z.object({}).merge(awsSchema);

export const env = createEnv(schema);
