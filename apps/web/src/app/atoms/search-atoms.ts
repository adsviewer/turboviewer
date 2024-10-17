import { atom } from 'jotai';
import { type SearchQueryStringsQuery } from '@/graphql/generated/schema-server';

export const searchQueryStringsAtom = atom<SearchQueryStringsQuery['searchQueryStrings']>([]);
