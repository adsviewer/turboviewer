import { Language } from '@repo/utils';

export const acceptedLanguage = (request: Request): Language => {
  const header = request.headers.get('accept-language');
  if (header === null) {
    return Language.EN;
  }

  const languages = header.split(',');
  const language = languages[0].split('-')[0];
  if (Object.values(Language).includes(language as Language)) {
    return language as Language;
  }

  return Language.EN;
};

export const acceptedLocale = (request: Request): string => {
  const header = request.headers.get('accept-language');
  if (header === null) {
    return Language.EN;
  }

  const languages = header.split(',');
  return languages[0];
};
