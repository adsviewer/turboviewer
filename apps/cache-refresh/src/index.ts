import { type Context, type Handler } from 'aws-lambda';
import { cacheSummaryTopAds } from '@repo/channel';

export const handler = async (_event: Handler, _context: Context): Promise<void> => {
  // @ts-expect-error -- this is fine
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- this is fine
  myUndefinedFunction();

  await cacheSummaryTopAds();
};
