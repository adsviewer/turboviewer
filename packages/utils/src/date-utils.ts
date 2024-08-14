const xMonths = 3;

export type IntervalType = 'day' | 'week' | 'month' | 'quarter';

export const extractDate = (date: Date): { year: number; month: string; day: string } => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(date.getUTCDate()).padStart(2, '0');
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
  tomorrow.setUTCDate(today.getUTCDate() + 1);
  const lastXMonths = getBeforeXMonths();
  return {
    since: lastXMonths,
    until: tomorrow,
  };
};

export const getDayPriorTillTomorrow = (date?: Date): { until: Date; since: Date } => {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return {
    since: getYesterday(date),
    until: tomorrow,
  };
};

export const getTomorrowStartOfDay = (date?: Date | null): Date => {
  const tomorrow = new Date(date ?? new Date());
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
};

export const getYesterday = (date?: Date): Date => {
  const yesterday = date ? date : new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);
  return yesterday;
};

export const getBeforeXMonths = (): Date => {
  const today = new Date();
  const xMonthsAgo = new Date(today);
  xMonthsAgo.setUTCMonth(today.getUTCMonth() - xMonths);
  xMonthsAgo.setUTCHours(0, 0, 0, 0);
  if (xMonthsAgo.getUTCFullYear() === today.getUTCFullYear()) {
    xMonthsAgo.setUTCMonth(0);
    xMonthsAgo.setUTCDate(1);
  }
  return xMonthsAgo;
};

export const addInterval = (date: Date, interval: IntervalType | 'seconds', numOfIntervals: number): Date => {
  const result = new Date(date);
  switch (interval) {
    case 'week':
      result.setUTCDate(result.getUTCDate() + numOfIntervals * 7);
      break;
    case 'quarter':
      result.setUTCMonth(result.getUTCMonth() + numOfIntervals * 3);
      break;
    case 'month':
      result.setUTCMonth(result.getUTCMonth() + numOfIntervals);
      break;
    case 'day':
      result.setUTCDate(result.getUTCDate() + numOfIntervals);
      break;
    case 'seconds':
      result.setUTCSeconds(result.getUTCSeconds() + numOfIntervals);
      break;
  }
  return result;
};

export const isDateWithinInterval = (
  dateFrom: Date,
  interval: IntervalType,
  dateTo: Date,
  numOfIntervals: number,
): boolean => {
  const targetDate = addInterval(dateFrom, interval, numOfIntervals);
  return targetDate < dateTo;
};
