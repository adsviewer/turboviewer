import { z } from 'zod';

export const channelIngressInput = z.object({
  initial: z.boolean(),
  integrationIds: z.array(z.string()).optional(),
});

export const channelIngressOutput = z.object({
  statusCode: z.number().int(),
  body: z.string(),
});
