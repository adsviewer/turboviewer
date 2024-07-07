export const stringifySorted = (obj: Record<string, unknown>): string => {
  const sortedObj = sortObjectKeysAndValues(obj);
  return JSON.stringify(sortedObj);
};

const sortObjectKeysAndValues = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj; // Return the value if obj is not an object
  }

  if (Array.isArray(obj)) {
    // eslint-disable-next-line @typescript-eslint/require-array-sort-compare -- we don't care about the order of elements, only that it's consistent
    return obj.map(sortObjectKeysAndValues).sort(); // Recursively sort array elements and then sort the array
  }

  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const result: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    result[key] = sortObjectKeysAndValues((obj as Record<string, unknown>)[key]); // Recursively sort keys and values
  }

  return result;
};
