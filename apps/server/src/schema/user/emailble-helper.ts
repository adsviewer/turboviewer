import { AError } from '@repo/utils';
import { logger } from '@repo/logger';
import { z } from 'zod';
import { env } from '../../config';

const emailableStats = ['deliverable', 'undeliverable', 'risky', 'unknown', 'duplicate'] as const;
type EmailableState = (typeof emailableStats)[number];

export const validateEmail = async (
  email: string,
): Promise<
  | AError
  | {
      domain: string;
      free: boolean;
      disposable: boolean;
      state: EmailableState;
    }
> => {
  logger.info('Validating email', { email });
  const response = await fetch(`https://api.emailable.com/v1/verify?email=${email}&api_key=${env.EMAILABLE_API_KEY}`);
  if (!response.ok) {
    logger.error(await response.json(), 'Error validating email', { email, response });
    return new AError('Error validating email');
  }
  const emailableSchema = z.object({
    domain: z.string(),
    disposable: z.boolean(),
    free: z.boolean(),
    state: z.enum(emailableStats),
  });
  const parsedData = emailableSchema.safeParse(await response.json());
  if (!parsedData.success) {
    logger.error(parsedData.error, 'Error parsing emailable response');
    return new AError('Error parsing emailable response');
  }
  logger.info(parsedData.data, 'Email validated');
  return parsedData.data;
};
