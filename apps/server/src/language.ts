export enum Language {
  EN = 'en',
}

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
