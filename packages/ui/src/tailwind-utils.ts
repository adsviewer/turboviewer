import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

type Cx = <T = undefined | null | string | boolean>(...a: T[]) => string;

export const cx: Cx = (...args) =>
  args
    .flat()
    .filter((x) => x !== null && x !== undefined && typeof x !== 'boolean')
    .join(' ');
