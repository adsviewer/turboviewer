import { type DateTimeFormatOptions } from 'next-intl';

export const dateFormatOptions: DateTimeFormatOptions = {
  month: 'numeric',
  day: 'numeric',
};

export const truncateString = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export const createFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`;
};
