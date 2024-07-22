import { atom } from 'jotai';
import { type InsightsQuery } from '@/graphql/generated/schema-server';

export const insightsAtom = atom<InsightsQuery['insights']['edges']>([]);
