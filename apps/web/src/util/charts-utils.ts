import { DateTime } from 'luxon';

export interface Datapoint {
  date: string;
  impressions: number | bigint;
  spend: number;
  cpm: number | bigint;
}

export const placeholderDatapoints: Datapoint[] = [
  {
    date: `${String(DateTime.now().day)}/${String(DateTime.now().month)}`,
    impressions: 12000,
    spend: 120,
    cpm: (1000 * 120) / 12000,
  },
  {
    date: `${String(DateTime.now().plus({ day: 1 }).day)}/${String(DateTime.now().month)}`,
    impressions: 15000,
    spend: 140,
    cpm: (1000 * 140) / 15000,
  },
  {
    date: `${String(DateTime.now().plus({ day: 2 }).day)}/${String(DateTime.now().month)}`,
    impressions: 8000,
    spend: 110,
    cpm: (1000 * 110) / 8000,
  },
  {
    date: `${String(DateTime.now().plus({ day: 3 }).day)}/${String(DateTime.now().month)}`,
    impressions: 9000,
    spend: 110,
    cpm: (1000 * 110) / 9000,
  },
  {
    date: `${String(DateTime.now().plus({ day: 4 }).day)}/${String(DateTime.now().month)}`,
    impressions: 15000,
    spend: 95,
    cpm: (1000 * 110) / 26000,
  },
  {
    date: `${String(DateTime.now().plus({ day: 5 }).day)}/${String(DateTime.now().month)}`,
    impressions: 14000,
    spend: 80,
    cpm: (1000 * 110) / 16000,
  },
  {
    date: `${String(DateTime.now().plus({ day: 6 }).day)}/${String(DateTime.now().month)}`,
    impressions: 18500,
    spend: 110,
    cpm: (1000 * 110) / 18500,
  },
];

export const placeholderSeries = [
  { yAxisId: 'left', name: 'impressions', color: 'blue.6', label: 'Impressions' },
  { yAxisId: 'right', name: 'cpm', color: 'orange', label: 'CPM' },
];
