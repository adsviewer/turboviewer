import _, { type Dictionary } from 'lodash';

export const mapDictionary = async <T, U>(
  dictionary: Dictionary<T[]>,
  fn: (value: T[], key: string) => Promise<U[]>,
): Promise<U[]> => {
  const promises: Promise<U[]>[] = [];

  _.forOwn(dictionary, (value, key) => {
    promises.push(fn(value, key));
  });
  return await Promise.all(promises).then((results) => results.flat());
};
