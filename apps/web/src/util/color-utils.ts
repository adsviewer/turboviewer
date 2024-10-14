export const uniqueColors = [
  'blue.7',
  'teal.9',
  'pink.4',
  'orange.4',
  'red.7',
  'green.4',
  'yellow.3',
  'violet.5',
  'teal.3',
  'lime.5',
];

export const getColor = (index: number): string => uniqueColors[index % uniqueColors.length];
