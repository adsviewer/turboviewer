/* eslint-disable @typescript-eslint/no-unsafe-member-access -- preserve the format of next-intl's docs */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- preserve the format of next-intl's docs */
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const localesMap = new Map([
  ['en-us', 'en'],
  ['en-gb', 'en'],
  ['el', 'el'],
  ['nl', 'nl'],
  ['fr', 'fr'],
]);

export default getRequestConfig(async () => {
  const locale = cookies().get('NEXT_LOCALE')?.value ?? 'en';

  return {
    locale,
    messages: (await import(`../messages/${localesMap.get(locale) ?? 'en'}.json`)).default,
  };
});
