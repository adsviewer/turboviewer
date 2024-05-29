import { type CurrencyEnum } from '@/graphql/generated/schema-server';

const currencySymbols: Partial<{ [key in CurrencyEnum]: string }> = {
  USD: '$', // US Dollar
  EUR: '€', // Euro
  GBP: '£', // British Pound
  JPY: '¥', // Japanese Yen
  AUD: 'A$', // Australian Dollar
  CAD: 'C$', // Canadian Dollar
  CHF: 'CHF', // Swiss Franc
  CNY: '¥', // Chinese Yuan
  SEK: 'kr', // Swedish Krona
  NZD: 'NZ$', // New Zealand Dollar
  // Add more currencies as needed
};

export const getCurrencySymbol = (currency: CurrencyEnum | null | undefined): string => {
  if (currency) {
    return currencySymbols[currency] ?? 'err';
  }
  return 'err';
};
