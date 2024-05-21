// e.g. AudienceNetwork -> Audience Network
export const titleCaseToSpaces = (str: string): string => {
  return str.replace(/(?!^)(?:[A-Z])/g, ' $&');
};

export const snakeCaseToTitleCaseWithSpaces = (str: string): string => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
