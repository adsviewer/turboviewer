import { type DateTimeFormatOptions } from 'next-intl';

export const dateFormatOptions: DateTimeFormatOptions = {
  month: 'numeric',
  day: 'numeric',
};

export const impressionsFormatOptions = { style: 'decimal' };

// e.g. AudienceNetwork -> Audience Network
export const titleCaseToSpaces = (str: string): string => {
  return str.replace(/(?!^)(?:[A-Z])/g, ' $&');
};

// e.g. facebook_reels -> Facebook Reels
export const snakeCaseToTitleCaseWithSpaces = (str: string): string => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
