const xMonths = 3;

export type IntervalType = 'day' | 'week' | 'month';

export const extractDate = (date: Date): { year: number; month: string; day: string } => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return { year, month, day };
};

export const formatYYYMMDDDate = (date: Date): string => {
  const { year, month, day } = extractDate(date);
  return `${String(year)}-${month}-${day}`;
};

/**
 * Get the last x months from today or year to date whichever is earlier
 */
export const getLastXMonths = (): { until: Date; since: Date } => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const lastXMonths = getBeforeXMonths();
  return {
    since: lastXMonths,
    until: tomorrow,
  };
};

export const getDayPriorTillTomorrow = (date?: Date): { until: Date; since: Date } => {
  const dayPrior = new Date(date ? date : new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dayPrior.setDate(dayPrior.getDate() - 1);
  return {
    since: dayPrior,
    until: tomorrow,
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
  if (xMonthsAgo.getFullYear() === today.getFullYear()) {
    xMonthsAgo.setMonth(0);
    xMonthsAgo.setDate(1);
  }
  return xMonthsAgo;
};

export const addInterval = (
  date: Date,
  interval: 'week' | 'month' | 'day' | 'seconds',
  numOfIntervals: number,
): Date => {
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
    case 'seconds':
      result.setSeconds(result.getSeconds() + numOfIntervals);
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
