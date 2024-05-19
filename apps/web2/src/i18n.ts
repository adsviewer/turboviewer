import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import el from '../messages/el.json';
import en from '../messages/en.json';

const localesMap = new Map([
  ['en-us', en],
  ['en-gb', en],
  ['el', el],
]);

export const locales = Array.from(localesMap.keys());

export default getRequestConfig(({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) notFound();

  return {
    messages: localesMap.get(locale) ?? en,
  };
});
