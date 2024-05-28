const xMonths = 3;

export type IntervalType = 'day' | 'week' | 'month';

const formatYYYMMDDDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
};

export const getLastXMonths = (): { until: string; since: string } => {
  const today = new Date();
  const lastXMonths = new Date(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  lastXMonths.setMonth(today.getMonth() - xMonths);
  return {
    since: formatYYYMMDDDate(lastXMonths),
    until: formatYYYMMDDDate(tomorrow),
  };
};

export const getLastXDays = (date?: Date): { until: string; since: string } => {
  const today = date ? date : new Date();
  const yesterday = new Date(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  yesterday.setDate(today.getDate() - 1);
  return {
    since: formatYYYMMDDDate(yesterday),
    until: formatYYYMMDDDate(tomorrow),
  };
};

export const getEndOfDay = (date?: Date | null): Date => {
  const endOfDay = new Date(date ?? new Date());
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

export const getYesterday = (date?: Date): Date => {
  const yesterday = date ? date : new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
};

export const getBeforeXMonths = (): Date => {
  const today = new Date();
  const xMonthsAgo = new Date(today);
  xMonthsAgo.setMonth(today.getMonth() - xMonths);
  xMonthsAgo.setHours(0, 0, 0, 0);
  return xMonthsAgo;
};

export const addInterval = (date: Date, interval: 'week' | 'month' | 'day', numOfIntervals: number): Date => {
  const result = new Date(date);
  switch (interval) {
    case 'week':
      result.setDate(result.getDate() + numOfIntervals * 7);
      break;
    case 'month':
      result.setMonth(result.getMonth() + numOfIntervals);
      break;
    case 'day':
      result.setDate(result.getDate() + numOfIntervals);
      break;
  }
  return result;
};

export const isDateWithinInterval = (
  dateFrom: Date,
  interval: 'week' | 'month' | 'day',
  dateTo: Date,
  numOfIntervals: number,
): boolean => {
  const targetDate = addInterval(dateFrom, interval, numOfIntervals);
  return targetDate < dateTo;
};
