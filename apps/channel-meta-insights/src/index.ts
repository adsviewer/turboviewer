// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { type APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { logger } from '@repo/logger';

interface Resp {
  statusCode: number;
  body: unknown;
}

// eslint-disable-next-line @typescript-eslint/require-await -- required for handler
export const handler = async (_event: APIGatewayRequestAuthorizerEventV2): Promise<Resp> => {
  logger.info('Success!');
  return {
    statusCode: 200,
    body: 'Success',
  };
};
