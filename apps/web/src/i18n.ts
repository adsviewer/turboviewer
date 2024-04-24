import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import gr from '../messages/gr.json';
import en from '../messages/en.json';

export const localesMap = new Map([
  ['en', en],
  ['gr', gr],
]);

export const locales = Array.from(localesMap.keys());

export default getRequestConfig(({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) notFound();

  return {
    messages: localesMap.get(locale) ?? en,
  };
});
