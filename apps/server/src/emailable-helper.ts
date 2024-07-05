import { AError, isAError } from '@repo/utils';
import { logger } from '@repo/logger';
import { z } from 'zod';
import { EmailType } from '@repo/database';
import { env } from './config';

const emailableStats = ['deliverable', 'undeliverable', 'risky', 'unknown', 'duplicate'] as const;
type EmailableState = (typeof emailableStats)[number];

const validateEmailApiCall = async (
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
  const response = await fetch(
    `https://api.emailable.com/v1/verify?email=${email}&api_key=${env.EMAILABLE_API_KEY}`,
  ).catch((e: unknown) => {
    logger.error(e, 'Error validating email');
    return new AError('Error validating email');
  });
  if (isAError(response)) {
    return response;
  }
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

export const validateEmail = async (
  email: string,
): Promise<AError | { emailType: 'PERSONAL' } | { domain: string; emailType: EmailType }> => {
  const emailValidation = await validateEmailApiCall(email);
  if (isAError(emailValidation)) {
    return { emailType: EmailType.PERSONAL };
  }
  if (emailValidation.disposable || emailValidation.state === 'undeliverable' || emailValidation.state === 'unknown') {
    return new AError('Please provide a valid email address.');
  }
  return { domain: emailValidation.domain, emailType: emailValidation.free ? EmailType.PERSONAL : EmailType.WORK };
};
