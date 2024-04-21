const formatYYYMMDDDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
};

export const getLastThreeMonths = () => {
  const today = new Date();
  const lastThreeMonths = new Date(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  lastThreeMonths.setMonth(today.getMonth() - 3);
  return {
    since: formatYYYMMDDDate(lastThreeMonths),
    until: formatYYYMMDDDate(tomorrow),
  };
};

export const getLastTwoDays = () => {
  const today = new Date();
  const yesterday = new Date(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  yesterday.setDate(today.getDate() - 1);
  return {
    since: formatYYYMMDDDate(yesterday),
    until: formatYYYMMDDDate(tomorrow),
  };
};