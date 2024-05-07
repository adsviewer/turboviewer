export const groupBy = <K, V>(array: V[], grouper: (item: V) => K) =>
  array.reduce((acc, item) => {
    const key = grouper(item);
    if (!acc.has(key)) {
      acc.set(key, [item]);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- it is checked above
      acc.get(key)!.push(item);
    }
    return acc;
  }, new Map<K, V[]>());

export const uniqueBy = <K, V>(array: V[], grouper: (item: V) => K) =>
  array.reduce((acc, item) => {
    const key = grouper(item);
    if (!acc.has(key)) {
      acc.add(key);
    }
    return acc;
  }, new Set<K>());
