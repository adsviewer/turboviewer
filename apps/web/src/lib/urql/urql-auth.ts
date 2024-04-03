import { authExchange, type AuthUtilities } from '@urql/exchange-auth';
import { logger } from '@repo/logger';
import { type ExchangeInput, type ExchangeIO } from '@urql/core';

export const makeAuthExchange = (token: string | undefined): ((input: ExchangeInput) => ExchangeIO) =>
  // eslint-disable-next-line @typescript-eslint/require-await -- required by urql
  authExchange(async (utilities: AuthUtilities) => {
    return {
      addAuthToOperation(operation) {
        if (!token) return operation;
        return utilities.appendHeaders(operation, {
          Authorization: `Bearer ${token}`,
        });
      },
      didAuthError: (error) => {
        return error.graphQLErrors.some((e) => e.message === 'jwt expired');
      },
      refreshAuth: async () => {
        await new Promise((_resolve) => {
          logger.info('Urql client (provider): Auth should refresh');
        });
      },
    };
  });
