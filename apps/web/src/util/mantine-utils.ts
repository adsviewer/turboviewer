import { type DateValue } from '@mantine/dates';

export const convertFromUTC = (date: DateValue): DateValue => {
  if (!date) return null;
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate;
};
