import { DateTime } from 'luxon';
import { type Integration } from '@/graphql/generated/schema-server';

const TOKEN_WARNING_DAYS_THRESHOLD = 10;

export const isTokenCloseToExpiration = (accessTokenExpiresAt: Integration['accessTokenExpiresAt']): boolean => {
  if (accessTokenExpiresAt) {
    const tokenExpirationDate = DateTime.fromISO(accessTokenExpiresAt.toString());
    const currentDate = DateTime.now().toUTC();
    const differenceInDays = Math.floor(tokenExpirationDate.diff(currentDate, 'days').days);
    if (differenceInDays < TOKEN_WARNING_DAYS_THRESHOLD) return true;
  }
  return false;
};
