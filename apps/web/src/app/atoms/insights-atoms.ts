import { atom } from 'jotai';
import { type InsightsQuery } from '@/graphql/generated/schema-server';

export const insightsAtom = atom<InsightsQuery['insights']['edges']>([]);
export const insightsChartAtom = atom<InsightsQuery['insights']['edges']>([]);
export const insightsTopAdsAtom = atom<InsightsQuery['insights']['edges']>([]);
export const hasNextInsightsPageAtom = atom<boolean>(false);
