import { Cacheable } from '@repo/redis';
import { type CurrencyEnum } from '@repo/database';
import { AError } from '@repo/utils';
import { logger } from '@repo/logger';
import { z } from 'zod';
import { env } from './config';

const getKey = (currency: CurrencyEnum): string => `usdValue:${currency}`;

const getFn = async (currency: CurrencyEnum): Promise<number | AError> => {
  const schema = z.object({
    success: z.boolean(),
    timestamp: z.number(),
    base: z.literal('EUR'),
    date: z.string(),
    rates: z.object({ [currency]: z.number() }),
  });

  const fetchCurrentRates = await fetch(
    `https://api.exchangeratesapi.io/v1/latest?access_key=${env.EXCHANGE_RATES_API_KEY}&format=1&symbols=${currency}`,
  )
    .then((response) => response.json())
    .catch((error: unknown) => {
      logger.error(error, 'Error fetching current rates');
    })
    .then((json) => schema.safeParse(json));

  if (!fetchCurrentRates.success) {
    logger.error(fetchCurrentRates, 'Error deserializing current rates');
    return new AError('Error fetching current rates');
  }
  return fetchCurrentRates.data.rates[currency];
};

export const currencyToEuro = new Cacheable(
  (currency: CurrencyEnum) => getKey(currency),
  (currency: CurrencyEnum) => getFn(currency),
  60 * 60 * 24,
);
