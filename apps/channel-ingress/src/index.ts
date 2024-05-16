import { type Handler } from 'aws-lambda';
import { logger } from '@repo/logger';
import { decryptTokens, refreshDataOf } from '@repo/channel';
import { prisma } from '@repo/database';

interface Resp {
  statusCode: number;
  body: unknown;
}

export const handler = async (event: Handler): Promise<Resp> => {
  logger.info(event);
  const integration = await prisma.integration
    .findUniqueOrThrow({
      where: { id: 'cluwfzvm20001lwr71gx1hcsn' },
    })
    .then(decryptTokens);

  if (!integration) {
    logger.error('Integration not found');
    return {
      statusCode: 404,
      body: 'Integration not found',
    };
  }
  await refreshDataOf(integration, false);
  logger.info('Success!');
  return {
    statusCode: 200,
    body: 'Success',
  };
};
